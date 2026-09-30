import type {
    AccountTier,
    AdaptiveConfig,
    RateLimitStructure,
    SystemMetrics,
} from "../types";
import { getMetrics } from "./metricsCollect";
import { getAdaptiveConfig, getTierConfig } from "../config/configService";

let adaptiveFactor = 1.0;

export function getAdaptiveFactor():number{
    return adaptiveFactor;
}

export function setAdaptiveFactor (factor: number): void {
    adaptiveFactor = Math.round(Math.max(0, Math.min(1, factor)) * 100) / 100;
};

// Applied per request, before the Redis call
export const applyAdaptiveScaling = (
    rule: RateLimitStructure,
    tier: AccountTier
): RateLimitStructure => {
    const tierFloor = getTierConfig(tier)?.adaptiveMinFactor ?? 0.3;
    const effective = Math.max(tierFloor, adaptiveFactor);

    return {
        capacity: Math.max(1, Math.floor(rule.capacity * effective)),
        refillRate: Math.max(0.001, rule.refillRate * effective),
    };
};

export const evaluateOnce = (
    metrics: SystemMetrics,
    config: AdaptiveConfig,
    currentFactor: number
): number => {
    const stressed =
        metrics.cpuUsage > config.cpuThresholdHigh ||
        metrics.avgLatency > config.latencyThresholdMs ||
        metrics.errorRate > config.errorRateThreshold;

    const healthy =
        metrics.cpuUsage < config.cpuThresholdLow &&
        metrics.avgLatency < config.latencyThresholdMs &&
        metrics.errorRate < config.errorRateThreshold;

    if (stressed) {
        return Math.max(config.minFactor, currentFactor - config.adjustmentStep);
    }
    if (healthy) {
        return Math.min(config.maxFactor, currentFactor + config.adjustmentStep);
    }
    return currentFactor; // dead zone — hold steady, prevent oscillation
};

const evaluate =(): void => {
    const config = getAdaptiveConfig();
    if (!config.enabled) return;

    const metrics = getMetrics();
    const next = evaluateOnce(metrics, config, adaptiveFactor); // dont wanna go below min 

    if (next !== adaptiveFactor) {
        console.log(
            `[adaptive] factor ${adaptiveFactor.toFixed(2)} → ${next.toFixed(2)} ` +
            `(cpu ${metrics.cpuUsage}%, latency ${metrics.avgLatency}ms, ` +
            `errors ${(metrics.errorRate * 100).toFixed(1)}%)`
        );
        setAdaptiveFactor(next);
    }
};

let interval: ReturnType<typeof setInterval> | null = null;

export const startAdaptiveThrottling = (): void => {
    if (interval) return;
    interval = setInterval(evaluate, getAdaptiveConfig().evaluationIntervalMs);
};

export const stopAdaptiveThrottling = (): void => {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
};