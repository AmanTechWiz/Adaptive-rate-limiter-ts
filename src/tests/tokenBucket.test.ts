import { describe, expect, it } from "vitest";
import { TokenBucket } from "../core/TokenBucket";

describe("TokenBucket", () => {
  it("starts full and spends one token", () => {
    const bucket = new TokenBucket(10, 1, 0);
    const result = bucket.tryToConsume(0);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.retryAfterms).toBe(0);
  });

  it("allows a burst up to capacity, then blocks", () => {
    const bucket = new TokenBucket(5, 1, 0);
    for (let i = 0; i < 5; i++) {
      expect(bucket.tryToConsume(0).allowed).toBe(true);
    }
    expect(bucket.tryToConsume(0).allowed).toBe(false);
  });

  it("computes retryAfterms proportional to missing tokens", () => {
    const bucket = new TokenBucket(5, 1, 0);
    for (let i = 0; i < 5; i++) bucket.tryToConsume(0);

    const halfRefilled = bucket.tryToConsume(500); // 0.5 tokens refilled
    expect(halfRefilled.allowed).toBe(false);
    expect(halfRefilled.retryAfterms).toBe(500);
  });

  it("refills lazily based on elapsed time", () => {
    const bucket = new TokenBucket(5, 1, 0);
    for (let i = 0; i < 5; i++) bucket.tryToConsume(0);

    expect(bucket.tryToConsume(0).allowed).toBe(false);
    expect(bucket.tryToConsume(2000).allowed).toBe(true); // 2s -> 2 tokens
    expect(bucket.tryToConsume(2000).allowed).toBe(true);
    expect(bucket.tryToConsume(2000).allowed).toBe(false);
  });

  it("never exceeds capacity", () => {
    const bucket = new TokenBucket(5, 10, 0);
    const result = bucket.tryToConsume(60_000); // idle 60s at 10/s would be 600 tokens
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
