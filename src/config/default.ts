import type { AccountTier, AdaptiveConfig, TierConfig } from "../types";

export const DEFAULT_TIER_CONFIGS: TierConfig[] = [
    {
        tier: "Free",
        default: { capacity: 20, refillRate: 1 },
        endpoints: [
            { endpoint: "/api/login", rule: { capacity: 3, refillRate: 0.2 } },
        ],
        adaptiveMinFactor: 0.3,
    },
    {
        tier: "Plus",
        default: { capacity: 100, refillRate: 5 },
        adaptiveMinFactor: 0.5,
    },
    {
        tier: "Max",
        default: { capacity: 300, refillRate: 20 },
        adaptiveMinFactor: 0.8,
    },
];

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
    enabled: true,
    cpuThresholdHigh: 80,
    cpuThresholdLow: 40,
    latencyThresholdMs: 500,
    errorRateThreshold: 0.1,
    minFactor: 0.3,
    maxFactor: 1.0,
    adjustmentStep: 0.05,
    evaluationIntervalMs: 5000,
};

export const DEFAULT_TIER: AccountTier = "Free";