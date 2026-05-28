package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/infoturker/bankchase-server/internal/config"
)

// Redis client wrapper
type Redis struct {
	client *redis.Client
}

func NewRedis(cfg *config.Config) (*redis.Client, error) {
	// Parse Redis URL
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Redis URL: %w", err)
	}

	opt.ReadTimeout = time.Duration(cfg.RedisTimeout) * time.Millisecond
	opt.WriteTimeout = time.Duration(cfg.RedisTimeout) * time.Millisecond

	client := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return client, nil
}

// IdempotencyRepository manages idempotency keys and cached responses
type IdempotencyRepository struct {
	client *redis.Client
}

func NewIdempotencyRepository(client *redis.Client) *IdempotencyRepository {
	return &IdempotencyRepository{client: client}
}

type IdempotencyResponse struct {
	TransactionID string                 `json:"transaction_id"`
	Status        string                 `json:"status"`
	Message       string                 `json:"message"`
	Timestamp     string                 `json:"timestamp"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// GetCachedResponse retrieves a cached response by idempotency key
func (r *IdempotencyRepository) GetCachedResponse(ctx context.Context, key string) (*IdempotencyResponse, error) {
	val, err := r.client.Get(ctx, fmt.Sprintf("idempotency:%s", key)).Result()
	if err == redis.Nil {
		return nil, nil // Not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get cached response: %w", err)
	}

	var response IdempotencyResponse
	if err := json.Unmarshal([]byte(val), &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cached response: %w", err)
	}

	return &response, nil
}

// CacheResponse stores a response for an idempotency key
func (r *IdempotencyRepository) CacheResponse(ctx context.Context, key string, response *IdempotencyResponse) error {
	data, err := json.Marshal(response)
	if err != nil {
		return fmt.Errorf("failed to marshal response: %w", err)
	}

	ttl := 24 * time.Hour // 24-hour TTL
	err = r.client.SetEx(ctx, fmt.Sprintf("idempotency:%s", key), data, ttl).Err()
	if err != nil {
		return fmt.Errorf("failed to cache response: %w", err)
	}

	return nil
}

// MarkProcessing sets a lock to prevent concurrent processing
func (r *IdempotencyRepository) MarkProcessing(ctx context.Context, key string) (bool, error) {
	lockKey := fmt.Sprintf("idempotency:lock:%s", key)
	lockTTL := 30 * time.Second

	// Use SET NX for atomic check-and-set
	val, err := r.client.SetNX(ctx, lockKey, "processing", lockTTL).Result()
	if err != nil {
		return false, fmt.Errorf("failed to mark processing: %w", err)
	}

	return val, nil
}

// ReleaseProcessing removes the processing lock
func (r *IdempotencyRepository) ReleaseProcessing(ctx context.Context, key string) error {
	lockKey := fmt.Sprintf("idempotency:lock:%s", key)
	err := r.client.Del(ctx, lockKey).Err()
	if err != nil {
		return fmt.Errorf("failed to release processing lock: %w", err)
	}
	return nil
}

// TransactionStatusRepository manages real-time transaction status
type TransactionStatusRepository struct {
	client *redis.Client
}

func NewTransactionStatusRepository(client *redis.Client) *TransactionStatusRepository {
	return &TransactionStatusRepository{client: client}
}

type TransactionStatus struct {
	TransactionID string            `json:"transaction_id"`
	Status        string            `json:"status"`
	Steps         []TransactionStep `json:"steps"`
	UpdatedAt     string            `json:"updated_at"`
}

type TransactionStep struct {
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Details   string    `json:"details,omitempty"`
}

// SetStatus stores transaction status
func (r *TransactionStatusRepository) SetStatus(ctx context.Context, transactionID string, status *TransactionStatus) error {
	data, err := json.Marshal(status)
	if err != nil {
		return fmt.Errorf("failed to marshal status: %w", err)
	}

	ttl := 7 * 24 * time.Hour // 7-day TTL
	err = r.client.SetEx(ctx, fmt.Sprintf("txn:status:%s", transactionID), data, ttl).Err()
	if err != nil {
		return fmt.Errorf("failed to set status: %w", err)
	}

	return nil
}

// GetStatus retrieves transaction status
func (r *TransactionStatusRepository) GetStatus(ctx context.Context, transactionID string) (*TransactionStatus, error) {
	val, err := r.client.Get(ctx, fmt.Sprintf("txn:status:%s", transactionID)).Result()
	if err == redis.Nil {
		return nil, nil // Not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	var status TransactionStatus
	if err := json.Unmarshal([]byte(val), &status); err != nil {
		return nil, fmt.Errorf("failed to unmarshal status: %w", err)
	}

	return &status, nil
}
