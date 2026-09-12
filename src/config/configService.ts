import type { AccountTier, TierConfig, RateLimitStructure } from "../types";
import { DEFAULT_TIER_CONFIGS } from "./default";

const tierMap = new Map<AccountTier, TierConfig>();

const init = (): void => {
    for (const config of DEFAULT_TIER_CONFIGS) {
        tierMap.set(config.tier, config);
    }
};

init();

export const getTierConfig = (tier: AccountTier): TierConfig | undefined =>
    tierMap.get(tier);

export const getAllTierConfigs = (): TierConfig[] =>
    Array.from(tierMap.values());

export const getRuleAndKey = (
    tier: AccountTier,
    endpoint: string
): { rule: RateLimitStructure; endpointKey: string } => {
    const config = tierMap.get(tier);

    if (!config) {
        return { rule: { capacity: 20, refillRate: 1 }, endpointKey: "default" };
    }

    const override = config.endpoints?.find(
        (e) => endpoint === e.endpoint || endpoint.startsWith(e.endpoint + "/")
    );

    return override
        ? { rule: override.rule, endpointKey: override.endpoint }
        : { rule: config.default, endpointKey: "default" };
};