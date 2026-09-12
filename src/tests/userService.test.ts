import { describe, expect, it } from "vitest";
import { getUserIdByApiKey, getUserTier, setUserTier } from "../config/userService";

describe("userService", () => {
    it("resolves a known API key to its user", () => {
        expect(getUserIdByApiKey("demo-free-key")).toBe("user-free");
    });

    it("returns undefined for an unknown API key", () => {
        expect(getUserIdByApiKey("hacker-key")).toBeUndefined();
    });

    it("resolves tier per user and defaults to Free", () => {
        expect(getUserTier("user-max")).toBe("Max");
        expect(getUserTier("nobody")).toBe("Free");
    });

    it("allows tier updates (admin flow)", () => {
        setUserTier("user-free", "Plus");
        expect(getUserTier("user-free")).toBe("Plus");
        setUserTier("user-free", "Free");
    });
});
