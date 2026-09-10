export interface RateLimitStructure {
    capacity : number;
    refillRate : number;
}

export type AccountTier = "Free" | "Plus" | "Max";