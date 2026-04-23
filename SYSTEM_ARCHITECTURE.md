# Admin Transfer System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CHASE BANK APPLICATION                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
         ┌──────▼─────┐    ┌──────▼────────┐  ┌───▼──────────┐
         │   LOGIN    │    │   DASHBOARD   │  │  ADMIN PAGE  │
         │   PAGE     │    │   /dashboard  │  │  /admin      │
         └────────────┘    └───────────────┘  └──────────────┘
                                  │
                          ┌───────▼────────┐
                          │  DEVICE REG    │
                          │  ON SIGNUP     │
                          └────────────────┘
```

## Admin Transfer Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ADMIN TRANSFER PROCESS                            │
└──────────────────────────────────────────────────────────────────────┘

STEP 1: INITIATE
┌─────────────────────────┐
│  Admin Dashboard        │
│  /admin                 │
│ ┌─────────────────────┐ │
│ │ SELECT USER         │ │
│ │ SELECT ACCOUNT      │ │
│ │ ENTER AMOUNT        │ │
│ │ CLICK INITIATE      │ │
│ └──────────┬──────────┘ │
└────────────┼─────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ POST /api/admin/transfers               │
│ action: 'initiate'                      │
│ toUserId, toAccountId, amount           │
└─────────────┬───────────────────────────┘
              │
              ├─► Validate admin role
              ├─► Verify user & account exist
              ├─► Create transfer record (pending_otp)
              ├─► Generate OTP
              ├─► Send OTP email to admin
              └─► Return transferId

STEP 2: CONFIRM
┌─────────────────────────────────────────┐
│  Admin Dialog                           │
│  Enter 6-digit OTP from email           │
│  Click "Confirm Transfer"               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ POST /api/admin/transfers               │
│ action: 'confirm'                       │
│ transferId, otp                         │
└─────────────┬───────────────────────────┘
              │
              ├─► Verify OTP
              ├─► Update transfer status (completed)
              ├─► Deposit funds to account
              ├─► Create transaction record
              ├─► Get user phone & email
              ├─► Fetch registered devices
              └─► TRIGGER ALERTS (below)

STEP 3: MULTI-CHANNEL ALERTS
                  │
        ┌─────────┼─────────┬──────────┬─────────┐
        │         │         │          │         │
        ▼         ▼         ▼          ▼         ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
    │ SMS    ││ PUSH   ││BROWSER ││ EMAIL  ││ AUDIT  │
    │ ALERT  ││NOTIF   ││NOTIF   ││ALERT   ││ LOG    │
    └────────┘└────────┘└────────┘└────────┘└────────┘
        │         │         │          │         │
        ├─────────┼─────────┼──────────┼─────────┤
        │
        └────────► ALL DEVICES NOTIFIED SIMULTANEOUSLY
```

## Multi-Device Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN COMPLETES TRANSFER                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │ FETCH USER DEVICES  │
                │ FROM DATABASE       │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │ iPhone 12   │  │ iPad Pro    │  │ Chrome      │
   │ (APNs)      │  │ (APNs)      │  │ Browser     │
   │ Device ID:  │  │ Device ID:  │  │ (Web Push)  │
   │ device_001  │  │ device_002  │  │ device_003  │
   └────────┬────┘  └────────┬────┘  └────────┬────┘
            │                │                │
            ├────────────────┼────────────────┤
            │                │                │
            │   ALL PUSH NOTIFICATIONS
            │   SENT SIMULTANEOUSLY
            │   (Real-time broadcasting)
            │
            ├──────────────────────────────────┤
            │
        ┌───▼────────┐
        │ Database:  │
        │ notification_logs (3 entries)
        │ - device_001: push, sent
        │ - device_002: push, sent
        │ - device_003: push, sent
        └────────────┘
```

## Database Schema Relationships

```
┌──────────────────┐
│ USERS            │
│ ────────────────│
│ id (PK)          │
│ email            │
│ name             │
│ phone            │
│ role             │ ──┐
└──────────────────┘   │
         │             │
         │      ┌──────┼──────────────┐
         │      │                     │
         ▼      ▼                     ▼
┌──────────────────────┐  ┌────────────────────────┐
│ ACCOUNTS             │  │ DEVICE_REGISTRATIONS   │
│ ────────────────────│  │ ──────────────────────│
│ id (PK)              │  │ device_id (PK)         │
│ user_id (FK)         │  │ user_id (FK)           │
│ name                 │  │ device_name            │
│ type                 │  │ device_type            │
│ balance              │  │ push_token             │
│ interest_rate        │  │ fcm_token              │
└──────────────────────┘  │ apns_token             │
         │                │ is_active              │
         │                │ last_seen              │
         │                └────────────────────────┘
         │
         └──────┬─────────────────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────────┐   ┌──────────────────────┐
        │ TRANSACTIONS     │   │ ADMIN_TRANSFERS      │
        │ ─────────────────│   │ ─────────────────────│
        │ id (PK)          │   │ id (PK)              │
        │ account_id (FK)  │   │ admin_id (FK)        │
        │ amount           │   │ user_id (FK)         │
        │ type             │   │ account_id (FK)      │
        │ category         │   │ amount               │
        │ description      │   │ status               │
        │ created_at       │   │ created_at           │
        └──────────────────┘   │ confirmed_at         │
                               └──────────────────────┘
                                      │
                                      │
                                      ▼
                               ┌──────────────────────┐
                               │ NOTIFICATION_LOGS    │
                               │ ─────────────────────│
                               │ id (PK)              │
                               │ user_id (FK)         │
                               │ device_id (FK)       │
                               │ type (sms/push/etc)  │
                               │ status               │
                               │ created_at           │
                               └──────────────────────┘

                               ┌──────────────────────┐
                               │ AUDIT_LOGS           │
                               │ ─────────────────────│
                               │ id (PK)              │
                               │ admin_id (FK)        │
                               │ action               │
                               │ details (JSON)       │
                               │ timestamp            │
                               └──────────────────────┘
```

## API Endpoint Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                                │
└─────────────────────────────────────────────────────────────────┘

ADMIN ENDPOINTS
┌────────────────────────────────────────────────┐
│ /api/admin/users                               │
│ GET  - List all users                          │
│ POST - Get new users or pending transfers      │
│        Headers: x-user-id, x-user-role         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ /api/admin/transfers                           │
│ POST - Initiate transfer (action: 'initiate')  │
│        Confirm transfer (action: 'confirm')    │
│ GET  - Get transfer history                    │
│        Headers: x-user-id, x-user-role         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ /api/admin/transfer-alerts                     │
│ POST - Send multi-channel alerts               │
│        Triggered after transfer complete       │
└────────────────────────────────────────────────┘

DEVICE MANAGEMENT ENDPOINTS
┌────────────────────────────────────────────────┐
│ /api/devices/register                          │
│ POST - Register device (action: 'register')    │
│        List devices (action: 'list')           │
│        Update activity (action: 'update-last-seen')
│        Unregister (action: 'unregister')       │
│        Headers: x-user-id                      │
└────────────────────────────────────────────────┘

NOTIFICATION ENDPOINTS
┌────────────────────────────────────────────────┐
│ /api/notifications/sms                         │
│ POST - Send SMS to single or multiple devices  │
│        broadcastToDevices: true/false          │
│        Headers: x-user-id                      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ /api/notifications/push                        │
│ POST - Send push to all registered devices     │
│        Supports FCM, APNs, Web Push            │
│        Headers: x-user-id                      │
└────────────────────────────────────────────────┘
```

## Real-Time Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  TRANSFER COMPLETION TRIGGERS ALERTS                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │ POST /api/admin/    │
                │ transfer-alerts     │
                └──────────┬──────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
        CHANNEL 1      CHANNEL 2      CHANNEL 3
            │              │              │
            ▼              ▼              ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ SMS ALERT  │  │ PUSH NOTIF │  │ EMAIL ALERT│
    │            │  │            │  │            │
    │ async send │  │ to ALL     │  │ async send │
    │ to phone   │  │ DEVICES    │  │ to email   │
    │            │  │            │  │            │
    │ [Twilio]   │  │ [FCM/APNs] │  │ [SendGrid] │
    └────────────┘  └────────────┘  └────────────┘
            │              │              │
            ▼              ▼              ▼
    ┌──────────────────────────────────────────┐
    │ DATABASE LOGGING                         │
    │ ─────────────────────────────────────────│
    │ INSERT INTO notification_logs:           │
    │ - sms:   status=sent                     │
    │ - push:  status=sent (device count: 3)   │
    │ - email: status=sent                     │
    └──────────────────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────────────────┐
    │ RECIPIENT RECEIVES ALERTS                │
    │ ─────────────────────────────────────────│
    │ SMS: "Chase Alert: $500 added..."        │
    │ PUSH: 3 devices receive notification     │
    │ EMAIL: Detailed receipt                  │
    │ BROWSER: Pop-up if app open              │
    └──────────────────────────────────────────┘
```

## Real-Time Dashboard Updates

```
ADMIN OPENS /admin DASHBOARD
        │
        ├─► Initialize Supabase subscriptions
        │
        ├─► Listen for admin_transfers changes
        │   ├─► INSERT - New transfer created
        │   ├─► UPDATE - Transfer status changed
        │   └─► DELETE - Transfer deleted
        │
        ├─► Listen for users changes
        │   └─► INSERT - New user registered
        │
        └─► On change → fetchDashboardData()
                │
                ├─► GET /api/admin/users
                │   ├─► New users count
                │   └─► Pending transfers
                │
                ├─► GET /api/admin/transfers
                │   ├─► Transfer history
                │   └─► Completed transfers
                │
                └─► Update UI
                    ├─► Stats cards
                    ├─► User list
                    ├─► Transfer history
                    └─► NO REFRESH NEEDED
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                               │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: AUTHENTICATION
┌─────────────────────────────────────────────┐
│ User Login with Password                    │
│ ├─ Password hashed with bcrypt              │
│ ├─ Session token generated                  │
│ └─ Token stored in secure HTTP-only cookie  │
└─────────────────────────────────────────────┘
         │
         ▼
LAYER 2: ROLE VERIFICATION
┌─────────────────────────────────────────────┐
│ Admin Endpoints Check Role                  │
│ ├─ Read x-user-role header                  │
│ ├─ Verify role = 'admin'                    │
│ └─ Reject if not admin                      │
└─────────────────────────────────────────────┘
         │
         ▼
LAYER 3: OTP VERIFICATION
┌─────────────────────────────────────────────┐
│ Transfer Requires OTP Confirmation          │
│ ├─ OTP generated (6 digits)                 │
│ ├─ OTP sent to admin email                  │
│ ├─ OTP expires after 15 minutes             │
│ ├─ OTP limited to 3 attempts                │
│ └─ Verify OTP before completing             │
└─────────────────────────────────────────────┘
         │
         ▼
LAYER 4: DATABASE SECURITY
┌─────────────────────────────────────────────┐
│ Row Level Security (RLS) Policies           │
│ ├─ Users only access own data               │
│ ├─ Admins see transfer data per role        │
│ ├─ Devices isolated by user                 │
│ └─ Notifications restricted by user         │
└─────────────────────────────────────────────┘
         │
         ▼
LAYER 5: AUDIT LOGGING
┌─────────────────────────────────────────────┐
│ Complete Audit Trail                        │
│ ├─ Admin ID logged with action              │
│ ├─ Timestamp recorded                       │
│ ├─ Transfer details saved                   │
│ └─ All changes traceable                    │
└─────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT STACK                              │
└─────────────────────────────────────────────────────────────────┘

FRONTEND (Next.js/React)
┌──────────────────────────────────────┐
│ /admin Dashboard                     │
│ Admin Transfer Form                  │
│ Real-time Updates (Supabase)         │
└──────────────────────────────────────┘
         │
         ▼
BACKEND (Next.js API Routes)
┌──────────────────────────────────────┐
│ /api/admin/* routes                  │
│ /api/devices/* routes                │
│ /api/notifications/* routes          │
│ OTP Verification                     │
│ Alert Triggering                     │
└──────────────────────────────────────┘
         │
         ▼
DATABASE (Supabase PostgreSQL)
┌──────────────────────────────────────┐
│ users, accounts                      │
│ admin_transfers                      │
│ device_registrations                 │
│ notification_logs                    │
│ audit_logs                           │
│ Row Level Security Policies          │
└──────────────────────────────────────┘
         │
         ▼
SERVICES (External)
┌──────────────────────────────────────┐
│ SMS Service (Twilio/AWS SNS)         │
│ Push Service (FCM/APNs)              │
│ Email Service (SendGrid/SES)         │
└──────────────────────────────────────┘
         │
         ▼
RECIPIENT DEVICES
┌──────────────────────────────────────┐
│ iPhone (APNs)                        │
│ Android (FCM)                        │
│ Web Browser (Web Push)               │
│ Email Client                         │
│ SMS Client (Phone)                   │
└──────────────────────────────────────┘
```

---

This architecture provides:
- Secure fund transfers with OTP verification
- Multi-channel notifications to all user devices
- Real-time dashboard updates
- Complete audit trails
- Enterprise-grade security
- Scalable database design
