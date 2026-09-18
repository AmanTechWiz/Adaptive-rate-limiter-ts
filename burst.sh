#!/bin/bash
# Burst test — usage: bash burst.sh [api-key] [count] [endpoint]
# Override port with PORT env, e.g. PORT=3001 bash burst.sh demo-free-key 25
API_KEY="${1:-demo-free-key}"
COUNT="${2:-25}"
ENDPOINT="${3:-/api/data}"
PORT="${PORT:-3000}"

echo "Bursting $COUNT requests with key '$API_KEY' → localhost:$PORT$ENDPOINT"
for i in $(seq 1 "$COUNT"); do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "x-api-key: $API_KEY" \
    "http://localhost:${PORT}$ENDPOINT"
done
echo ""
