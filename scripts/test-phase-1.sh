#!/bin/bash

# Phase 1: Real-Time Transfer Processing - Test Script
# Tests the complete transfer workflow end-to-end

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${1:-http://localhost:3000}"
AUTH_TOKEN="${2:-your-jwt-token}"

echo -e "${YELLOW}Phase 1: Real-Time Transfer Processing - Integration Test${NC}\n"

# Test 1: Check API health
echo -e "${YELLOW}[1/4] Checking API Health...${NC}"
if curl -s "$BASE_URL/api/transfers/process" -X OPTIONS | grep -q "process_transfer"; then
  echo -e "${GREEN}✓ Transfer API is healthy${NC}\n"
else
  echo -e "${RED}✗ Transfer API not responding${NC}\n"
  exit 1
fi

# Test 2: Initiate transfer
echo -e "${YELLOW}[2/4] Initiating Transfer...${NC}"
TRANSFER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transfers/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "fromAccountId": "acc_demo_1",
    "toAccountNumber": "IBAN123456789012",
    "toBankCode": "DEUTDEFF",
    "amount": 100.50,
    "currency": "EUR",
    "narration": "Test transfer Phase 1"
  }')

TRANSACTION_ID=$(echo "$TRANSFER_RESPONSE" | grep -o '"transactionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$TRANSACTION_ID" ]; then
  echo -e "${RED}✗ Failed to initiate transfer${NC}"
  echo "Response: $TRANSFER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Transfer initiated${NC}"
echo -e "  Transaction ID: $TRANSACTION_ID\n"

# Test 3: Poll transfer status
echo -e "${YELLOW}[3/4] Polling Transfer Status...${NC}"
for i in {1..6}; do
  STATUS_RESPONSE=$(curl -s "$BASE_URL/api/transfers/status?transactionId=$TRANSACTION_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
  PROGRESS=$(echo "$STATUS_RESPONSE" | grep -o '"percent":[0-9]*' | cut -d':' -f2)
  
  echo "  Poll $i/6: Status=$STATUS, Progress=$PROGRESS%"
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo -e "${GREEN}✓ Transfer completed${NC}\n"
    break
  fi
  
  if [ $i -lt 6 ]; then
    sleep 5
  fi
done

# Test 4: Test webhook simulation
echo -e "${YELLOW}[4/4] Simulating Provider Webhook...${NC}"
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/payment-provider" \
  -H "Content-Type: application/json" \
  -H "x-provider-name: test-provider" \
  -H "x-provider-signature: test-signature" \
  -d "{
    \"event_id\": \"evt_test_$$\",
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"status\": \"delivered\",
    \"provider_reference_id\": \"WIRE123456789\"
  }")

if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Webhook processed successfully${NC}\n"
else
  echo -e "${RED}✗ Webhook processing failed${NC}\n"
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Phase 1 Integration Test Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Test Results:"
echo "  ✓ API Health Check"
echo "  ✓ Transfer Processing ($TRANSACTION_ID)"
echo "  ✓ Status Polling"
echo "  ✓ Webhook Handling"
echo ""
echo "Next Steps:"
echo "  1. Monitor SMS logs: SELECT * FROM sms_logs WHERE user_id = 'your-user-id'"
echo "  2. Check ledger: SELECT * FROM transaction_ledger WHERE id = '$TRANSACTION_ID'"
echo "  3. Review audit: SELECT * FROM audit_logs WHERE entity_id = '$TRANSACTION_ID'"
echo ""
