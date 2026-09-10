import type { AccountTier,RateLimitStructure } from "../types";

export const TIERS:Record<AccountTier,RateLimitStructure> = {
    Free:{capacity: 5, refillRate: 1},
    Plus:{capacity: 10, refillRate: 5},
    Max:{capacity: 100, refillRate: 30},

};

export const DEFAULT_TIER: AccountTier = "Free";