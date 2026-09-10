#!/bin/bash
# Burst test - Proof 1
# Usage: bash burst.sh [user-id] [count]
USER_ID="${1:-user-1}"
COUNT="${2:-10}"

echo "Bursting $COUNT requests as '$USER_ID'..."
for i in $(seq 1 "$COUNT"); do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "incoming-user-id: $USER_ID" \
    -H "incoming-tier-id: Free" \
    http://localhost:3000/api/data
done
echo ""
echo "Expected pattern: five 200 then all 429"
