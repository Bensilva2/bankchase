package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/infoturker/bankchase-server/internal/repository"
)

type TransferRequest struct {
	SenderID          string  `json:"senderId" binding:"required"`
	ReceiverAccountID string  `json:"receiverAccountId" binding:"required"`
	Amount            float64 `json:"amount" binding:"required,gt=0"`
	Currency          string  `json:"currency" binding:"required"`
	SenderPhone       string  `json:"senderPhone"`
	Reference         string  `json:"reference"`
}

type TransferResponse struct {
	Status        string    `json:"status"`
	Message       string    `json:"message"`
	TransactionID string    `json:"transactionId"`
	Timestamp     string    `json:"timestamp"`
	IdempotencyKey string   `json:"idempotencyKey"`
}

type TransferHandler struct {
	ledgerRepo       *repository.TransactionLedgerRepository
	idempotencyRepo  *repository.IdempotencyRepository
}

func NewTransferHandler(
	ledgerRepo *repository.TransactionLedgerRepository,
	idempotencyRepo *repository.IdempotencyRepository,
) *TransferHandler {
	return &TransferHandler{
		ledgerRepo:      ledgerRepo,
		idempotencyRepo: idempotencyRepo,
	}
}

// InternalTransfer handles internal bank transfers
func (h *TransferHandler) InternalTransfer(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get idempotency key from context (set by middleware)
	idempotencyKey, _ := c.Get("idempotency_key")
	keyStr := idempotencyKey.(string)

	// Check for cached response
	cachedResp, err := h.idempotencyRepo.GetCachedResponse(c.Request.Context(), keyStr)
	if err == nil && cachedResp != nil {
		c.JSON(http.StatusOK, cachedResp)
		return
	}

	// Try to acquire processing lock
	acquired, err := h.idempotencyRepo.MarkProcessing(c.Request.Context(), keyStr)
	if err != nil || !acquired {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Request is already being processed",
		})
		return
	}

	defer h.idempotencyRepo.ReleaseProcessing(c.Request.Context(), keyStr)

	// Generate transaction ID
	transactionID := fmt.Sprintf("TXN-%d-%s", time.Now().UnixNano(), uuid.New().String()[:8])

	// Record transaction in ledger
	txn := &repository.TransactionLedger{
		TransactionID:     transactionID,
		SenderAccountID:   req.SenderID,
		ReceiverAccountID: req.ReceiverAccountID,
		Amount:            req.Amount,
		Currency:          req.Currency,
		TransactionType:   "transfer",
		Status:            "processing",
		IdempotencyKey:    keyStr,
	}

	if err := h.ledgerRepo.RecordTransaction(c.Request.Context(), txn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to record transaction",
		})
		return
	}

	// Prepare response
	response := &TransferResponse{
		Status:         "success",
		Message:        "Transfer initiated",
		TransactionID:  transactionID,
		Timestamp:      time.Now().UTC().Format(time.RFC3339),
		IdempotencyKey: keyStr,
	}

	// Cache response for idempotency
	idempotencyResp := &repository.IdempotencyResponse{
		TransactionID: transactionID,
		Status:        "success",
		Message:       "Transfer initiated",
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
	}
	h.idempotencyRepo.CacheResponse(c.Request.Context(), keyStr, idempotencyResp)

	c.JSON(http.StatusOK, response)
}

// GetTransferStatus retrieves transfer status
func (h *TransferHandler) GetTransferStatus(c *gin.Context) {
	transactionID := c.Query("transactionId")
	if transactionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "transactionId parameter required"})
		return
	}

	txn, err := h.ledgerRepo.GetTransaction(c.Request.Context(), transactionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactionId": txn.TransactionID,
		"status":        txn.Status,
		"amount":        txn.Amount,
		"currency":      txn.Currency,
		"initiatedAt":   txn.InitiatedAt,
		"completedAt":   txn.CompletedAt,
	})
}

// InternationalTransfer handles cross-border transfers
func (h *TransferHandler) InternationalTransfer(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "International transfer endpoint",
		"status":  "not_implemented",
	})
}

// GetExchangeRate retrieves current exchange rates
func (h *TransferHandler) GetExchangeRate(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")
	amount := c.Query("amount")

	if from == "" || to == "" || amount == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing required parameters: from, to, amount",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"from":   from,
		"to":     to,
		"amount": amount,
		"rate":   1.0, // TODO: Get real rate from payment provider
	})
}

type WebhookHandler struct {
	ledgerRepo *repository.TransactionLedgerRepository
}

func NewWebhookHandler(ledgerRepo *repository.TransactionLedgerRepository) *WebhookHandler {
	return &WebhookHandler{
		ledgerRepo: ledgerRepo,
	}
}

// ProviderWebhook handles webhooks from payment providers
func (h *WebhookHandler) ProviderWebhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "acknowledged",
	})
}

// AdminHealthCheck returns health status
func AdminHealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// AdminMetrics returns system metrics
func AdminMetrics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"uptime": "calculated",
		"goroutines": "runtime.NumGoroutine()",
		"memory": "runtime.MemStats{}",
	})
}
