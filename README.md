# Adaptive Rate Limiter (TypeScript)

Distributed, tier-aware API rate limiter — atomic token buckets in Redis (Lua), API-key identity, per-endpoint rules, and a self-tuning adaptive throttler.

> **Temporary README** — full documentation lands in Phase 7.

## Status

| Phase | What | Status |
|---|---|---|
| 0+1 | Express skeleton + in-memory token bucket | ✅ done |
| 2 | Redis + Lua atomic buckets, fail-open | ✅ done |
| 3 | API-key identity, tiers, per-endpoint rules | ✅ done |
| 4 | Metrics + adaptive throttler | 🔜 next |
| 5 | Admin dashboard (runtime config) | ⬜ planned |
| 6 | Docker + CI | ⬜ planned |
| 7 | k6 load tests + final README | ⬜ planned |

## How it works

- **Token bucket per user:** `capacity` tokens, refilled at `refillRate` tokens/sec (lazy refill — no background timers).
- **Atomic checks:** buckets live in Redis hashes (`User:{userId}:{endpoint}`); the full read-refill-consume-write runs as one Lua script (`EVALSHA`), so concurrent requests across instances cannot double-spend.
- **Identity:** requests carry `x-api-key` → resolved server-side to a user and tier (`Free` / `Plus` / `Max`). Client-claimed tiers are ignored. Missing key → anonymous (Free); unknown key → `401`.
- **Per-endpoint rules:** stricter override for `/api/login`, with its own Redis bucket.
- **Resilience:** if Redis is unreachable, the limiter fails open (availability over enforcement).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit + integration tests (needs Redis)
npm run typecheck
```

Redis locally:

```bash
docker run --name rl-redis -p 6379:6379 -d redis:7-alpine
```

Quick check:

```bash
bash burst.sh demo-free-key 25            # 20 × 200, then 429s
bash burst.sh demo-free-key 5 /api/login  # 3 × 200, then 429s (stricter)
```

## API surface

| Endpoint | Rate limited | Notes |
|---|---|---|
| `GET /health` | no | status, Redis health, metrics |
| `GET /api/data` | yes | demo resource |
| `GET /api/login` | yes | stricter override for Free |

Request header: `x-api-key`. Response headers: `Available_tokens`, `tokens_remaining`, `RateLimit_reset_time`, `Retry_after`.

Demo keys: `demo-free-key`, `demo-plus-key`, `demo-max-key`.

## Stack

TypeScript · Node · Express 5 · ioredis · Redis + Lua · Vitest · supertest
