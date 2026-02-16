#!/bin/bash

# Create a checkout session first
echo "Creating checkout session..."
SESSION_RESPONSE=$(curl -s -X POST "https://checkout-microservice.vercel.app/api/public/generate-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "TEST-DIRECT-'$(date +%s)'",
    "booking_data": {
      "id": "TEST-DIRECT-'$(date +%s)'",
      "house_name": "Casa Teste",
      "guest_name": "Test Guest",
      "guest_email": "test@example.com",
      "guest_document": "12345678909",
      "guest_phone": "11999999999",
      "check_in": "2026-03-01",
      "check_out": "2026-03-05",
      "total_price": 1500,
      "guest_count": 2
    },
    "stay_amount": 1500,
    "deposit_amount": 1000
  }')

TOKEN=$(echo $SESSION_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
BOOKING_ID=$(echo $SESSION_RESPONSE | grep -o '"booking_id":"[^"]*"' | cut -d'"' -f4 | head -1)

echo "Token: $TOKEN"
echo "Booking ID: $BOOKING_ID"

# Try to process PIX payment
echo -e "\nProcessing PIX payment..."
curl -v -X POST "https://checkout-microservice.vercel.app/api/checkout/process" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN'",
    "bookingId": "'$BOOKING_ID'",
    "paymentData": {
      "stayMethod": "PIX"
    }
  }'
