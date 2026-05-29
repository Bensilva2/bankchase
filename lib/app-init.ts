/**
 * Application initialization module
 * Runs on server startup to initialize event consumers and background services
 */

import { initializeEventConsumers } from './event-emitter';
import { initializeAlertConsumer } from './alert-consumer';
import { setAlertConsumerActive } from '@/app/api/admin/health/route';

let initialized = false;

/**
 * Initialize all background services
 * Should be called once on application startup
 */
export async function initializeBackgroundServices(): Promise<void> {
  if (initialized) {
    console.log('[AppInit] Background services already initialized');
    return;
  }

  try {
    console.log('[AppInit] Initializing background services...');

    // Initialize event system
    initializeEventConsumers();
    console.log('[AppInit] ✓ Event emitter initialized');

    // Initialize alert consumer
    initializeAlertConsumer();
    setAlertConsumerActive(true);
    console.log('[AppInit] ✓ Alert consumer initialized');

    initialized = true;
    console.log('[AppInit] All background services ready');
  } catch (error) {
    console.error('[AppInit] Failed to initialize background services:', error);
    throw error;
  }
}

/**
 * Check if services are initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Graceful shutdown of background services
 */
export async function shutdownBackgroundServices(): Promise<void> {
  if (!initialized) return;

  try {
    console.log('[AppInit] Shutting down background services...');
    setAlertConsumerActive(false);
    initialized = false;
    console.log('[AppInit] Background services shut down gracefully');
  } catch (error) {
    console.error('[AppInit] Error during shutdown:', error);
  }
}
