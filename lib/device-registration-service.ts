/**
 * Device Registration Service - Register and manage user devices for push notifications
 * Integrates with signup flow and session management
 */

import crypto from 'crypto'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: 'web' | 'ios' | 'android'
  pushToken?: string
  fcmToken?: string
  apnsToken?: string
  userAgent: string
  isCurrentDevice: boolean
}

/**
 * Generate unique device ID for browser/device
 */
export function generateDeviceId(): string {
  // Combine device fingerprint components
  const fingerprint = {
    timestamp: Date.now(),
    random: Math.random().toString(36).substr(2, 9),
    userAgent: navigator.userAgent.substring(0, 20),
  }

  // Create hash from fingerprint
  const hash = btoa(JSON.stringify(fingerprint)).substring(0, 16)
  return `device_${Date.now()}_${hash}`
}

/**
 * Get or create device ID in localStorage
 */
export function getOrCreateDeviceId(): string {
  const key = 'chase_device_id'
  let deviceId = localStorage.getItem(key)

  if (!deviceId) {
    deviceId = generateDeviceId()
    localStorage.setItem(key, deviceId)
    console.log('[v0] Created new device ID:', deviceId)
  }

  return deviceId
}

/**
 * Detect device type
 */
export function detectDeviceType(): 'web' | 'ios' | 'android' {
  const userAgent = navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios'
  } else if (/android/.test(userAgent)) {
    return 'android'
  }

  return 'web'
}

/**
 * Get device name from user agent
 */
export function getDeviceName(): string {
  const userAgent = navigator.userAgent
  const deviceType = detectDeviceType()

  if (deviceType === 'ios') {
    const match = userAgent.match(/\((.*?)\)/)
    return match ? `iPhone/iPad - ${match[1]}` : 'iPhone/iPad'
  } else if (deviceType === 'android') {
    return 'Android Device'
  } else {
    // Web - detect browser
    if (userAgent.includes('Chrome')) {
      return 'Chrome Browser'
    } else if (userAgent.includes('Safari')) {
      return 'Safari Browser'
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox Browser'
    } else if (userAgent.includes('Edge')) {
      return 'Edge Browser'
    }
    return 'Web Browser'
  }
}

/**
 * Register device after signup
 */
export async function registerDeviceAfterSignup(
  userId: string,
  pushToken?: string,
  fcmToken?: string,
  apnsToken?: string
): Promise<DeviceInfo> {
  try {
    const deviceId = getOrCreateDeviceId()
    const deviceType = detectDeviceType()
    const deviceName = getDeviceName()

    const deviceData: any = {
      action: 'register',
      deviceId,
      deviceName,
      deviceType,
    }

    if (pushToken) deviceData.pushToken = pushToken
    if (fcmToken) deviceData.fcmToken = fcmToken
    if (apnsToken) deviceData.apnsToken = apnsToken

    console.log('[v0] Registering device:', {
      deviceId,
      deviceType,
      deviceName,
    })

    const response = await fetch('/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(deviceData),
    })

    if (!response.ok) {
      throw new Error('Failed to register device')
    }

    const data = await response.json()

    console.log('[v0] Device registered successfully:', {
      deviceId,
      isCurrentDevice: true,
    })

    return {
      deviceId,
      deviceName,
      deviceType,
      isCurrentDevice: true,
      userAgent: navigator.userAgent,
      pushToken,
      fcmToken,
      apnsToken,
    }
  } catch (error) {
    console.error('[v0] Error registering device:', error)
    throw error
  }
}

/**
 * Request push notification permission and get token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if browser supports Notification API
    if (!('Notification' in window)) {
      console.log('[v0] This browser does not support notifications')
      return null
    }

    // Check if already granted
    if (Notification.permission === 'granted') {
      console.log('[v0] Notification permission already granted')
      return 'granted'
    }

    // Request permission
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      console.log('[v0] Notification permission:', permission)
      return permission === 'granted' ? permission : null
    }

    return null
  } catch (error) {
    console.error('[v0] Error requesting notification permission:', error)
    return null
  }
}

/**
 * Show browser notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        tag: 'chase-notification',
        ...options,
      })
      console.log('[v0] Notification shown:', title)
    } catch (error) {
      console.error('[v0] Error showing notification:', error)
    }
  }
}

/**
 * List all registered devices for user
 */
export async function listUserDevices(userId: string): Promise<DeviceInfo[]> {
  try {
    const response = await fetch('/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ action: 'list' }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch devices')
    }

    const data = await response.json()
    return data.devices || []
  } catch (error) {
    console.error('[v0] Error listing devices:', error)
    return []
  }
}

/**
 * Unregister a device
 */
export async function unregisterDevice(
  userId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        action: 'unregister',
        deviceId,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[v0] Error unregistering device:', error)
    return false
  }
}

/**
 * Send test notification to device
 */
export async function sendTestNotification(
  userId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        title: 'Chase Notification',
        message: 'You have successfully registered this device for notifications',
        data: {
          type: 'test',
          deviceId,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[v0] Error sending test notification:', error)
    return false
  }
}
