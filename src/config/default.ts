import type { AccountTier, TierConfig } from "../types";

export const DEFAULT_TIER_CONFIGS: TierConfig[] = [
    {
        tier: "Free",
        default: { capacity: 20, refillRate: 1 },
        endpoints: [
            { endpoint: "/api/login", rule: { capacity: 3, refillRate: 0.2 } },
        ],
    },
    {
        tier: "Plus",
        default: { capacity: 100, refillRate: 5 },
    },
    {
        tier: "Max",
        default: { capacity: 300, refillRate: 20 },
    },
];

export const DEFAULT_TIER: AccountTier = "Free";

