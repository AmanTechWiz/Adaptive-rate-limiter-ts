export interface RateLimitStructure {
    capacity : number;
    refillRate : number;
}

export type AccountTier = "Free" | "Plus" | "Max";

export interface EndpointOverride{
    endpoint:string;
    rule: RateLimitStructure;
}

export interface TierConfig{
    tier:AccountTier;
    default:RateLimitStructure;
    endpoints?:EndpointOverride[];
}

export interface AuthenticatedUser{
    userId:string;
    tier:AccountTier;
}