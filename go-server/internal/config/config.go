package config

import (
	"os"
)

type Config struct {
	// Server
	Port    string
	Env     string
	TLSCert string
	TLSKey  string

	// Database
	DatabaseURL            string
	DatabaseMaxConnections int

	// Redis
	RedisURL     string
	RedisTimeout int

	// Payment Provider
	CurrencyCloudAPIKey    string
	CurrencyCloudSecret    string
	DefaultPaymentProvider string

	// Security
	WebhookSecret         string
	MTLSClientCertPath    string
	MTLSClientKeyPath     string
	MTLSCACertPath        string

	// AWS (for ECS/EKS deployment)
	AWSRegion string
	ECSCluster string
}

func LoadConfig() *Config {
	return &Config{
		// Server
		Port:    getEnv("PORT", "8080"),
		Env:     getEnv("ENVIRONMENT", "development"),
		TLSCert: getEnv("TLS_CERT_PATH", ""),
		TLSKey:  getEnv("TLS_KEY_PATH", ""),

		// Database
		DatabaseURL:            getEnv("DATABASE_URL", ""),
		DatabaseMaxConnections: 25,

		// Redis
		RedisURL:     getEnv("UPSTASH_REDIS_REST_URL", ""),
		RedisTimeout: 5000,

		// Payment Provider
		CurrencyCloudAPIKey:    getEnv("CURRENCYCLOUD_API_KEY", ""),
		CurrencyCloudSecret:    getEnv("CURRENCYCLOUD_API_SECRET", ""),
		DefaultPaymentProvider: getEnv("DEFAULT_PAYMENT_PROVIDER", "currencycloud"),

		// Security
		WebhookSecret:      getEnv("WEBHOOK_SECRET", ""),
		MTLSClientCertPath: getEnv("MTLS_CLIENT_CERT_PATH", ""),
		MTLSClientKeyPath:  getEnv("MTLS_CLIENT_KEY_PATH", ""),
		MTLSCACertPath:     getEnv("MTLS_CA_CERT_PATH", ""),

		// AWS
		AWSRegion:  getEnv("AWS_REGION", "us-east-1"),
		ECSCluster: getEnv("ECS_CLUSTER", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
