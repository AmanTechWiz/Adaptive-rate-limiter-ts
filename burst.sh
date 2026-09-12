#!/bin/bash
# Burst test — usage: bash burst.sh [api-key] [count] [endpoint]
API_KEY="${1:-demo-free-key}"
COUNT="${2:-25}"
ENDPOINT="${3:-/api/data}"

echo "Bursting $COUNT requests with key '$API_KEY' → $ENDPOINT"
for i in $(seq 1 "$COUNT"); do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "x-api-key: $API_KEY" \
    "http://localhost:3000$ENDPOINT"
done
echo ""
