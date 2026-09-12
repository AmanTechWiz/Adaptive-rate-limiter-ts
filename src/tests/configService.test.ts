import { describe, expect, it } from "vitest";
import { getRuleAndKey, getTierConfig } from "../config/configService";

describe("configService", () => {
    it("returns the tier default for a normal endpoint", () => {
        const { rule, endpointKey } = getRuleAndKey("Free", "/api/data");
        expect(rule).toEqual({ capacity: 20, refillRate: 1 });
        expect(endpointKey).toBe("default");
    });

    it("returns the stricter override for /api/login", () => {
        const { rule, endpointKey } = getRuleAndKey("Free", "/api/login");
        expect(rule).toEqual({ capacity: 3, refillRate: 0.2 });
        expect(endpointKey).toBe("/api/login");
    });

    it("prefix-matches nested paths under an override", () => {
        const { endpointKey } = getRuleAndKey("Free", "/api/login/refresh");
        expect(endpointKey).toBe("/api/login");
    });

    it("applies overrides only to the tier that defines them", () => {
        const { endpointKey } = getRuleAndKey("Plus", "/api/login");
        expect(endpointKey).toBe("default");
    });

    it("exposes tier config by tier", () => {
        expect(getTierConfig("Max")?.default).toEqual({ capacity: 300, refillRate: 20 });
    });
});
