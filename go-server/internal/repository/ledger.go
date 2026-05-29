package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/infoturker/bankchase-server/internal/config"
)

type TransactionLedger struct {
	ID                   int64         `db:"id"`
	TransactionID        string        `db:"transaction_id"`
	SenderAccountID      string        `db:"sender_account_id"`
	ReceiverAccountID    string        `db:"receiver_account_id"`
	Amount               float64       `db:"amount"`
	Currency             string        `db:"currency"`
	TransactionType      string        `db:"transaction_type"`
	Status               string        `db:"status"`
	IdempotencyKey       string        `db:"idempotency_key"`
	ProviderReference    string        `db:"provider_reference"`
	ProviderName         string        `db:"provider_name"`
	FailureReason        string        `db:"failure_reason"`
	InitiatedAt          time.Time     `db:"initiated_at"`
	CompletedAt          *time.Time    `db:"completed_at"`
	FailedAt             *time.Time    `db:"failed_at"`
	CreatedAt            time.Time     `db:"created_at"`
	UpdatedAt            time.Time     `db:"updated_at"`
}

type TransactionLedgerRepository struct {
	db *pgxpool.Pool
}

func NewTransactionLedgerRepository(db *pgxpool.Pool) *TransactionLedgerRepository {
	return &TransactionLedgerRepository{db: db}
}

// RecordTransaction inserts a new transaction into the ledger
func (r *TransactionLedgerRepository) RecordTransaction(ctx context.Context, txn *TransactionLedger) error {
	query := `
		INSERT INTO transaction_ledger (
			transaction_id, sender_account_id, receiver_account_id,
			amount, currency, transaction_type, status, idempotency_key,
			provider_reference, provider_name, initiated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		txn.TransactionID, txn.SenderAccountID, txn.ReceiverAccountID,
		txn.Amount, txn.Currency, txn.TransactionType, txn.Status,
		txn.IdempotencyKey, txn.ProviderReference, txn.ProviderName,
		time.Now(),
	).Scan(&txn.ID, &txn.CreatedAt, &txn.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to record transaction: %w", err)
	}

	return nil
}

// GetTransaction retrieves a transaction by ID
func (r *TransactionLedgerRepository) GetTransaction(ctx context.Context, transactionID string) (*TransactionLedger, error) {
	txn := &TransactionLedger{}
	query := `
		SELECT id, transaction_id, sender_account_id, receiver_account_id,
		       amount, currency, transaction_type, status, idempotency_key,
		       provider_reference, provider_name, failure_reason,
		       initiated_at, completed_at, failed_at, created_at, updated_at
		FROM transaction_ledger
		WHERE transaction_id = $1
	`

	err := r.db.QueryRow(ctx, query, transactionID).Scan(
		&txn.ID, &txn.TransactionID, &txn.SenderAccountID, &txn.ReceiverAccountID,
		&txn.Amount, &txn.Currency, &txn.TransactionType, &txn.Status,
		&txn.IdempotencyKey, &txn.ProviderReference, &txn.ProviderName,
		&txn.FailureReason, &txn.InitiatedAt, &txn.CompletedAt, &txn.FailedAt,
		&txn.CreatedAt, &txn.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	return txn, nil
}

// UpdateTransactionStatus updates the status of a transaction
func (r *TransactionLedgerRepository) UpdateTransactionStatus(ctx context.Context, transactionID, newStatus string) error {
	query := `
		UPDATE transaction_ledger
		SET status = $1, updated_at = $2
		WHERE transaction_id = $3
	`

	result, err := r.db.Exec(ctx, query, newStatus, time.Now(), transactionID)
	if err != nil {
		return fmt.Errorf("failed to update transaction status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("transaction not found: %s", transactionID)
	}

	return nil
}

// DB represents the database connection pool
type DB struct {
	pool *pgxpool.Pool
}

func NewDB(cfg *config.Config) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create database pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

func (db *DB) Close() {
	if db.pool != nil {
		db.pool.Close()
	}
}
