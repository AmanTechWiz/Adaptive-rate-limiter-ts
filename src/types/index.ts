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
    adaptiveMinFactor: number; // this will be for per tier 
}

export interface AuthenticatedUser{
    userId:string;
    tier:AccountTier;
}

export interface SystemMetrics {
    cpuUsage: number;          // CPU usage percentage.
    memoryUsage: number;       // heap vs total mem in server
    avgLatency: number;        // latency calc in ms
    errorRate: number;         // total errors from server not infra..
    infraErrors: number;       // redis related mainly.
    requestsPerSecond: number;
    totalRequests: number;
    blockedRequests: number;
    timestamp: number;
}

export interface AdaptiveConfig {
    enabled: boolean;
    cpuThresholdHigh: number;
    cpuThresholdLow: number;
    latencyThresholdMs: number;
    errorRateThreshold: number;
    minFactor: number;
    maxFactor: number;
    adjustmentStep: number;
    evaluationIntervalMs: number;
}
