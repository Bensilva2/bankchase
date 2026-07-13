# Bankchase Integrations Guide

This document outlines all integrations configured for the Bankchase application.

## Meticulous Recorder

### Overview
Meticulous automatically records user sessions to keep tests up-to-date as your application changes.

### Configuration
- **Environment Variable**: `METICULOUS_RECORDING_TOKEN`
- **Enabled In**: Development, Preview, and Staging environments
- **Location**: Configured in `/app/layout.tsx`

### Features
- Captures user actions and network requests
- Records responses for testing
- Automatically redacts plaintext passwords
- Provides continuous session coverage as you develop

### Setup
1. Get your recording token from [Meticulous Dashboard](https://app.meticulous.ai)
2. Add `METICULOUS_RECORDING_TOKEN` to your Vercel environment variables
3. The script is automatically injected in non-production environments

## Cloudflare Integration

### Overview
Cloudflare provides DNS management, R2 object storage, and other services for the application.

### Environment Variables Required
```
CLOUDFLARE_API_TOKEN          # Your Cloudflare API token
CLOUDFLARE_ACCOUNT_ID          # Your Cloudflare account ID
CLOUDFLARE_R2_ACCESS_KEY_ID    # R2 access key
CLOUDFLARE_R2_SECRET_ACCESS_KEY # R2 secret key
CLOUDFLARE_R2_BUCKET_NAME      # Default R2 bucket name
```

### DNS Management
**API Endpoint**: `/api/cloudflare/dns`

#### List DNS Records
```typescript
GET /api/cloudflare/dns?zoneId=YOUR_ZONE_ID&type=A
```

#### Create DNS Record
```typescript
POST /api/cloudflare/dns
{
  "zoneId": "YOUR_ZONE_ID",
  "record": {
    "type": "A",
    "name": "example.com",
    "content": "192.0.2.1",
    "ttl": 3600,
    "proxied": false
  }
}
```

#### Update DNS Record
```typescript
PATCH /api/cloudflare/dns
{
  "zoneId": "YOUR_ZONE_ID",
  "recordId": "RECORD_ID",
  "record": {
    "type": "A",
    "name": "example.com",
    "content": "192.0.2.2",
    "ttl": 3600
  }
}
```

#### Delete DNS Record
```typescript
DELETE /api/cloudflare/dns?zoneId=YOUR_ZONE_ID&recordId=RECORD_ID
```

### R2 Object Storage
**API Endpoint**: `/api/cloudflare/r2`

#### List Objects in Bucket
```typescript
GET /api/cloudflare/r2?bucket=BUCKET_NAME
```

#### Generate Upload URL (Signed)
```typescript
POST /api/cloudflare/r2
{
  "bucket": "my-bucket",
  "key": "path/to/file.jpg",
  "contentType": "image/jpeg"
}
```
Response includes `signedUrl` and `method: "PUT"` for direct client upload.

#### Generate Download URL (Signed)
```typescript
GET /api/cloudflare/r2?bucket=BUCKET_NAME&key=path/to/file.jpg
```

#### Delete Object
```typescript
DELETE /api/cloudflare/r2?bucket=BUCKET_NAME&key=path/to/file.jpg
```

### Using Cloudflare Hooks

React hooks are available in `/lib/hooks/use-cloudflare.ts`:

#### DNS Hook
```typescript
import { useCloudflareDNS } from '@/lib/hooks/use-cloudflare';

function MyComponent() {
  const { listRecords, createRecord, loading, error } = useCloudflareDNS();
  
  const handleListRecords = async () => {
    const records = await listRecords('zone-id', 'A');
    console.log(records);
  };
  
  return <button onClick={handleListRecords}>Load Records</button>;
}
```

#### R2 Hook
```typescript
import { useCloudflareR2 } from '@/lib/hooks/use-cloudflare';

function UploadComponent() {
  const { getSignedUploadUrl, loading, error } = useCloudflareR2();
  
  const handleUpload = async () => {
    const uploadUrl = await getSignedUploadUrl('my-bucket', 'uploads/photo.jpg', 'image/jpeg');
    // Use uploadUrl for direct client-side upload
  };
  
  return <button onClick={handleUpload}>Get Upload URL</button>;
}
```

## Cloudflare Client Library

Direct usage in server-side code:

```typescript
import { getDNSRecords, createDNSRecord, getR2BucketInfo } from '@/lib/cloudflare-client';

// Get DNS records
const records = await getDNSRecords('zone-id', 'A');

// Create DNS record
const newRecord = await createDNSRecord('zone-id', {
  type: 'CNAME',
  name: 'api.example.com',
  content: 'api-gateway.example.com',
  ttl: 3600,
  proxied: true,
});

// Get R2 bucket info
const bucketInfo = await getR2BucketInfo('my-bucket');
```

## Security Notes

### API Token Rotation
- Regularly rotate your `CLOUDFLARE_API_TOKEN`
- If exposed, immediately revoke at [Cloudflare Dashboard](https://dash.cloudflare.com)

### Environment Variables
- **NEVER** commit environment variables to Git
- Always use Vercel's environment variable system
- Use different tokens for staging and production

### R2 Credentials
- Keep R2 access keys secure
- Use IAM policies to restrict R2 access to specific buckets
- Rotate keys regularly

## Troubleshooting

### Missing Credentials Error
Ensure all required environment variables are set:
```bash
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_R2_ACCESS_KEY_ID
```

### API Request Failures
- Check that Cloudflare API token has necessary permissions
- Verify zone IDs and bucket names are correct
- Check Cloudflare API status at [status.cloudflare.com](https://status.cloudflare.com)

### R2 Upload Issues
- Ensure bucket name matches exactly
- Verify R2 credentials have `s3:PutObject` permission
- Check signed URL hasn't expired

## Resources

- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Meticulous Docs](https://docs.meticulous.ai/)
