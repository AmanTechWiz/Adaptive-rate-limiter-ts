import type { AccountTier,RateLimitStructure } from "../types";

export const TIERS:Record<AccountTier,RateLimitStructure> = {
    Free:{capacity: 20, refillRate: 1},
    Plus:{capacity: 100, refillRate: 5},
    Max:{capacity: 300, refillRate: 20},

};

export const DEFAULT_TIER: AccountTier = "Free";