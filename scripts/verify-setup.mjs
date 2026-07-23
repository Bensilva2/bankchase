#!/usr/bin/env node

/**
 * Verify that all required environment variables are set for the application
 */

const requiredEnvVars = [
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
];

const optionalEnvVars = [
  'METICULOUS_RECORDING_TOKEN',
  'CLOUDFLARE_R2_BUCKET_NAME',
];

console.log('\n🔍 Verifying Environment Setup...\n');

let allValid = true;

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach((variable) => {
  const isSet = Boolean(process.env[variable]);
  const status = isSet ? '✅' : '❌';
  console.log(`  ${status} ${variable}`);
  if (!isSet) allValid = false;
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach((variable) => {
  const isSet = Boolean(process.env[variable]);
  const status = isSet ? '✅' : '⚠️';
  console.log(`  ${status} ${variable}`);
});

console.log('\n📦 Package Dependencies:');
try {
  require.resolve('@aws-sdk/client-s3');
  console.log('  ✅ @aws-sdk/client-s3');
} catch (e) {
  console.log('  ❌ @aws-sdk/client-s3');
  allValid = false;
}

try {
  require.resolve('@aws-sdk/s3-request-presigner');
  console.log('  ✅ @aws-sdk/s3-request-presigner');
} catch (e) {
  console.log('  ❌ @aws-sdk/s3-request-presigner');
  allValid = false;
}

console.log('\n📄 Configuration Files:');
const fs = require('fs');
const path = require('path');

const configFiles = [
  'lib/cloudflare-client.ts',
  'app/api/cloudflare/dns/route.ts',
  'app/api/cloudflare/r2/route.ts',
  'lib/hooks/use-cloudflare.ts',
  'docs/INTEGRATIONS.md',
];

configFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) allValid = false;
});

console.log('\n');
if (allValid) {
  console.log('✨ All required setup verified! Application is ready to run.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some setup requirements are missing. Please check the output above.\n');
  process.exit(1);
}
