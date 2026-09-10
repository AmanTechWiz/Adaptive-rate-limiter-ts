import {redis} from "./client";

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1];
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call("HMGET",key,"tokens","last_refill")
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  last_refill = now
end

local time_diff = math.max(0, (now - last_refill) / 1000)
tokens = math.min(capacity, tokens + time_diff * refill_rate)

local allowed = 0
if tokens >= 1 then
  allowed = 1
  tokens = tokens - 1
end

redis.call("HSET", key, "tokens", tokens, "last_refill", now)

local ttl = 60
if refill_rate > 0 then
  ttl = math.max(60, math.ceil((capacity / refill_rate) * 2))
end
redis.call("EXPIRE", key, ttl)

local retry_after_ms = 0
if allowed == 0 and refill_rate > 0 then
  retry_after_ms = math.ceil(((1 - tokens) / refill_rate) * 1000)
end

return { allowed, tokens, retry_after_ms }
`;

let scriptSha : string | undefined;

export const loadScripts = async (): Promise<void> => {
  scriptSha = (await redis.script("LOAD", TOKEN_BUCKET_SCRIPT)) as string;
};

export const runTokenBucketScript = async ( key: string,capacity: number,refillRate: number,now: number): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> => {
  if (!scriptSha) await loadScripts();

  let raw: unknown;
  try {
    raw = await redis.evalsha(
      scriptSha!,
      1,
      key,
      String(capacity),
      String(refillRate),
      String(now)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("NOSCRIPT")) throw err;
    await loadScripts();
    raw = await redis.evalsha(
      scriptSha!,
      1,
      key,
      String(capacity),
      String(refillRate),
      String(now)
    );
  }
  const [allowed, remaining, retryAfterMs] = (raw as Array<number | string>).map(Number);
  return { allowed: allowed === 1, remaining, retryAfterMs };
};