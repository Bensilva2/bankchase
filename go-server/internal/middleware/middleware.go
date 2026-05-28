package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"fmt"
	"hex"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger middleware for request logging
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s\" %d %d \"%s\" \"%s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC3339),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.BodySize,
			param.Request.Referer(),
			param.Request.UserAgent(),
		)
	})
}

// ErrorHandler middleware for error recovery
func ErrorHandler() gin.HandlerFunc {
	return gin.RecoveryWithWriter(gin.DefaultErrorWriter)
}

// CORS middleware
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Signature, X-Timestamp, Idempotency-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// IdempotencyKey middleware validates idempotency key header
func IdempotencyKey() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("Idempotency-Key")
		if key == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Missing Idempotency-Key header",
			})
			c.Abort()
			return
		}

		// Validate format (UUID or similar)
		if len(key) < 20 || len(key) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid Idempotency-Key format",
			})
			c.Abort()
			return
		}

		c.Set("idempotency_key", key)
		c.Next()
	}
}

// AuthRequired middleware validates Authorization header
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Missing Authorization header",
			})
			c.Abort()
			return
		}

		// TODO: Validate API key against database
		// For now, accept any Bearer token
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid Authorization header",
			})
			c.Abort()
			return
		}

		apiKey := authHeader[7:]
		c.Set("api_key", apiKey)
		c.Next()
	}
}

// WebhookSignature middleware validates webhook signatures
func WebhookSignature() gin.HandlerFunc {
	return func(c *gin.Context) {
		signature := c.GetHeader("X-Signature")
		timestamp := c.GetHeader("X-Timestamp")

		if signature == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Missing X-Signature header",
			})
			c.Abort()
			return
		}

		// Verify timestamp (prevent replay attacks)
		if timestamp != "" {
			webhookTime := parseInt64(timestamp, 0)
			currentTime := time.Now().Unix()
			maxAgeSeconds := int64(5 * 60) // 5 minutes

			if currentTime-webhookTime > maxAgeSeconds {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Webhook timestamp is stale",
				})
				c.Abort()
				return
			}
		}

		// TODO: Verify HMAC signature using webhook secret
		// For now, just accept the webhook

		c.Set("webhook_signature", signature)
		c.Set("webhook_timestamp", timestamp)
		c.Next()
	}
}

// Helper function to parse int64 from string
func parseInt64(s string, defaultVal int64) int64 {
	var result int64
	_, err := fmt.Sscanf(s, "%d", &result)
	if err != nil {
		return defaultVal
	}
	return result
}

// Helper function to verify HMAC signature
func VerifySignature(payload string, signature string, secret string) bool {
	expectedSignature := hmac.New(sha256.New, []byte(secret))
	expectedSignature.Write([]byte(payload))
	expected := fmt.Sprintf("%x", expectedSignature.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expected))
}
