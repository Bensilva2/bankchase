# BankChase Comprehensive Security Implementation

Complete guide for enterprise-grade security features including encryption, masking, auditing, and real-time alerts.

## Quick Start

### 1. Install Required Dependencies

```bash
cd backend
pip install cryptography bcrypt
```

### 2. Run Database Migrations

Execute these SQL migrations in your database (Supabase SQL editor or similar):

```bash
# Run in order:
1. migrations/010_enhanced_rls_policies.sql
2. migrations/011_encryption_setup.sql
3. migrations/012_comprehensive_audit_logging.sql
4. migrations/013_alert_system.sql
```

### 3. Set Environment Variables

```bash
# Encryption key - generate with:
python -c "from backend.security.encryption import generate_encryption_key; print(generate_encryption_key())"

# Then set in .env.local:
ENCRYPTION_KEY=<generated-key>
ALERT_EMAIL=security@bankchase.com
AUDIT_LOG_RETENTION_DAYS=365
```

### 4. Update main.py

```python
from middleware.security_middleware import (
    SecurityMiddleware,
    PermissionMiddleware,
    DataMaskingMiddleware
)

# Add middleware to your FastAPI app
app.add_middleware(SecurityMiddleware)
app.add_middleware(PermissionMiddleware)
app.add_middleware(DataMaskingMiddleware)
```

## Architecture Overview

### Security Layers

```
┌─────────────────────────────────────────────┐
│           FastAPI Application               │
├─────────────────────────────────────────────┤
│  Security Middleware (Audit, Permissions)   │
├─────────────────────────────────────────────┤
│  Access Control (RBAC)                      │
│  Data Masking                               │
│  Alert Management                           │
├─────────────────────────────────────────────┤
│  PostgreSQL Database                        │
├─────────────────────────────────────────────┤
│  Row-Level Security (RLS)                   │
│  Column Encryption                          │
│  Audit Triggers                             │
│  Alert Functions                            │
└─────────────────────────────────────────────┘
```

## Security Features

### 1. Row-Level Security (RLS)

Prevents unauthorized data access at the database level.

**Features:**
- Users see only their own data
- Admins see all data
- Auditors have read-only access
- Compliance can view sensitive reports

**Usage:**
- Automatically enforced by database policies
- No code changes needed in most cases

### 2. Column-Level Encryption

Sensitive data encrypted at rest in the database.

**Encrypted Columns:**
- users.ssn_encrypted
- users.phone_encrypted
- accounts.card_number_encrypted
- accounts.card_cvv_encrypted

**Usage:**

```python
from security.encryption import encrypt_value, decrypt_value

# Encrypt data before storing
encrypted_ssn = encrypt_value("123-45-6789")

# Decrypt data when needed (only authorized users)
original_ssn = decrypt_value(encrypted_ssn)
```

### 3. Dynamic Data Masking

Automatically masks sensitive data in API responses based on user role.

**Masking Patterns:**
- SSN: XXX-XX-1234
- Card: XXXX-XXXX-XXXX-1234
- Phone: XXX-XXX-1234
- Email: u***@example.com

**Usage:**

```python
from security.data_masking import mask_sensitive_data

# Mask data for non-admin users
user_data = {
    'name': 'John Doe',
    'ssn': '123-45-6789',
    'card_number': '4111-1111-1111-1111'
}

masked = mask_sensitive_data(user_data, user_role='customer')
# Result: ssn='XXX-XX-6789', card_number='XXXX-XXXX-XXXX-1111'
```

### 4. Comprehensive Audit Logging

Tracks all operations for compliance and forensic analysis.

**Logged Information:**
- User ID and operation (INSERT/UPDATE/DELETE/SELECT)
- Table name and record ID
- Old and new values
- IP address and timestamp
- Operation status and error messages

**Audit Tables:**
- audit_log: All operations
- data_access_log: Who accessed what data
- sensitive_data_access: Access to PII/sensitive fields

**Usage:**

```python
from security.audit_logger import log_operation, get_record_history

# Log an operation
await log_operation(
    user_id=user_id,
    operation='UPDATE',
    table_name='accounts',
    record_id=account_id,
    old_values={'balance': 1000},
    new_values={'balance': 1500},
    ip_address=client_ip
)

# Get record history
history = await get_record_history('accounts', account_id)
for change in history:
    print(f"{change['operation']}: {change['old_values']} -> {change['new_values']}")
```

### 5. Real-Time Alert System

Monitors suspicious activities and generates alerts.

**Alert Types:**
- Large transfers (>$5000)
- Failed login attempts (5+ in 15 mins)
- Bulk data access (100+ records)
- Sensitive data access
- Unusual access times
- Concurrent logins
- Data deletion
- Account status changes

**Alert Severity Levels:**
- LOW: Informational
- MEDIUM: Requires review
- HIGH: Immediate action needed
- CRITICAL: Potential breach

**Usage:**

```python
from security.alert_manager import AlertManager, AlertType, AlertSeverity

# Create alert for large transfer
await AlertManager.check_large_transfer(user_id, amount=5500)

# Create alert for failed logins
await AlertManager.check_failed_login(user_id, ip_address='192.168.1.1')

# Get unresolved alerts
alerts = await AlertManager.get_unresolved_alerts()

# Resolve an alert
await AlertManager.resolve_alert(alert_id=123, resolution_notes="False positive")
```

### 6. Role-Based Access Control (RBAC)

Fine-grained permission management.

**Roles:**
- **customer**: Can view/manage own accounts and transfers
- **admin**: Full system access
- **auditor**: Read-only access to all data
- **compliance**: View sensitive data and reports, no modifications

**Permissions:**
- Account management (view, create, update, delete)
- Transfer operations (create, approve)
- User management (view, update roles, delete)
- Audit access (view logs, alerts)
- Sensitive data access
- Export and reporting

**Usage:**

```python
from security.access_control import AccessControl, Permission

# Check permission
has_access = AccessControl.has_permission(user_role, Permission.VIEW_ALL_ACCOUNTS)

# Check multiple permissions
can_manage = AccessControl.has_all_permissions(
    user_role,
    [Permission.VIEW_ALL_ACCOUNTS, Permission.UPDATE_ALL_ACCOUNTS]
)

# Get all permissions for a role
perms = AccessControl.get_user_permissions('admin')
```

## Integration Examples

### Securing an Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException
from security.access_control import AccessControl, Permission

router = APIRouter(prefix="/api/accounts", tags=["accounts"])

@router.get("/")
async def list_accounts(user_id: str, user_role: str):
    # Check permission
    if not AccessControl.has_permission(user_role, Permission.VIEW_ALL_ACCOUNTS):
        if user_role != 'customer':
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        # Customers can only see their own accounts
        accounts = await get_user_accounts(user_id)
    else:
        accounts = await get_all_accounts()
    
    # Mask sensitive data
    from security.data_masking import mask_sensitive_data
    masked_accounts = [
        mask_sensitive_data(acc, user_role=user_role)
        for acc in accounts
    ]
    
    return masked_accounts
```

### Adding Audit Logging

```python
from security.audit_logger import log_operation

@router.post("/transfer")
async def create_transfer(from_id: str, to_id: str, amount: float, user_id: str):
    # Process transfer
    result = await process_transfer(from_id, to_id, amount)
    
    # Log operation
    await log_operation(
        user_id=user_id,
        operation='INSERT',
        table_name='transfers',
        record_id=result['id'],
        new_values={'from_id': from_id, 'to_id': to_id, 'amount': amount}
    )
    
    # Check for alerts
    from security.alert_manager import AlertManager
    await AlertManager.check_large_transfer(user_id, amount)
    
    return result
```

### Encrypting Sensitive Data

```python
from security.encryption import encrypt_value, decrypt_value

# When storing
async def create_account(ssn: str, card_number: str, ...):
    encrypted_ssn = encrypt_value(ssn)
    encrypted_card = encrypt_value(card_number)
    
    await execute(
        "INSERT INTO accounts (ssn_encrypted, card_number_encrypted) VALUES ($1, $2)",
        encrypted_ssn,
        encrypted_card
    )

# When retrieving (with authorization check)
async def get_account_details(account_id: str, user_role: str):
    account = await fetchrow("SELECT * FROM accounts WHERE id = $1", account_id)
    
    # Only admin/compliance can see decrypted data
    from security.access_control import AccessControl
    if AccessControl.can_view_sensitive_data(user_role):
        account['ssn'] = decrypt_value(account['ssn_encrypted'])
        account['card_number'] = decrypt_value(account['card_number_encrypted'])
    
    return account
```

## Compliance & Standards

### GDPR Compliance
- Data encryption at rest
- Audit trails for data access
- Right to be forgotten (deletion logs)
- Data retention policies

### PCI DSS Compliance
- Sensitive authentication data encrypted
- Restricted access to cardholder data
- Audit logs for cardholder data access
- Network segmentation via RLS

### SOC 2 Compliance
- Comprehensive audit logging
- Access controls and RBAC
- Security monitoring via alerts
- Incident response procedures

## Best Practices

### Password Management

```python
from security.encryption import hash_password, verify_password

# Store password hash (never store plaintext)
hashed = hash_password(user_password)

# Verify password on login
is_valid = verify_password(provided_password, hashed)
```

### Encryption Key Rotation

```python
# Generate new key annually
new_key = EncryptionManager.generate_encryption_key()

# Update ENCRYPTION_KEY environment variable
# Re-encrypt all data with new key
```

### Audit Log Cleanup

```python
# Clean logs older than 365 days (monthly)
await AuditLogger.cleanup_old_logs(days_to_keep=365)
```

### Alert Management

```python
# Check unresolved alerts daily
alerts = await AlertManager.get_unresolved_alerts()

# Investigate high-severity alerts
critical = await AlertManager.get_alerts_by_severity('critical')
for alert in critical:
    print(f"Investigate: {alert['message']}")
```

## Monitoring & Maintenance

### Daily Tasks
- Review critical alerts
- Check for suspicious login patterns
- Monitor data access logs

### Weekly Tasks
- Review audit logs for anomalies
- Check alert resolution time
- Verify encryption key integrity

### Monthly Tasks
- Clean old audit logs
- Generate compliance reports
- Review user access permissions
- Test disaster recovery

### Annual Tasks
- Security audit
- Penetration testing
- Key rotation
- Policy updates

## Troubleshooting

### Decryption Failures

If decryption fails, verify:
- ENCRYPTION_KEY environment variable is set
- Using correct key version
- Data wasn't corrupted

### Permission Denied Errors

Check:
- User role is correctly set
- User has required permissions
- RLS policies allow operation

### Alert Not Triggering

Verify:
- Alert is enabled in alert_configurations table
- Threshold is correctly set
- Condition is met (e.g., transfer > $5000)

## Support & Questions

For questions or issues:
1. Check SECURITY_SETUP.md (this file)
2. Review SQL migrations for database setup
3. Check security module docstrings
4. Create an issue or contact security team

---

**Last Updated:** 2024
**Version:** 1.0
**Maintainer:** Security Team
