package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/infoturker/bankchase-server/internal/config"
	"github.com/infoturker/bankchase-server/internal/handler"
	"github.com/infoturker/bankchase-server/internal/middleware"
	"github.com/infoturker/bankchase-server/internal/repository"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	db, err := repository.NewDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redis, err := repository.NewRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer redis.Close()

	// Create repositories
	ledgerRepo := repository.NewTransactionLedgerRepository(db)
	idempotencyRepo := repository.NewIdempotencyRepository(redis)

	// Set up Gin router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.Logger())
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.CORS())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Transfer endpoints
	transferHandler := handler.NewTransferHandler(ledgerRepo, idempotencyRepo)

	// Internal transfers (fast, low-cost)
	router.POST("/api/v1/transfers/internal", middleware.IdempotencyKey(), middleware.AuthRequired(), transferHandler.InternalTransfer)
	router.GET("/api/v1/transfers/internal/status", transferHandler.GetTransferStatus)

	// International transfers (cross-border, FX)
	router.POST("/api/v1/transfers/international", middleware.IdempotencyKey(), middleware.AuthRequired(), transferHandler.InternationalTransfer)
	router.GET("/api/v1/transfers/international/rates", transferHandler.GetExchangeRate)

	// Webhook endpoints
	webhookHandler := handler.NewWebhookHandler(ledgerRepo)
	router.POST("/api/v1/webhooks/provider", middleware.WebhookSignature(), webhookHandler.ProviderWebhook)

	// Admin endpoints
	router.GET("/api/v1/admin/health", handler.AdminHealthCheck)
	router.GET("/api/v1/admin/metrics", handler.AdminMetrics)

	// Start server
	port := cfg.Port
	log.Printf("Starting BankChase Go Server on port %s\n", port)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Failed to start server: %v", err)
	}
}
