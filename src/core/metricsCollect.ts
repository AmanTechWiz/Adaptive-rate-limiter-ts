import os from "os";
import type { SystemMetrics } from "../types";

// initializing rolling window counters which will be refeshed after every x secs
let totalRequests = 0;
let blockedRequests = 0;
let serverErrors = 0;
let infraErrors = 0;
let totalLatency = 0;
let windowStart = Date.now();

let currentMetrics: SystemMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    avgLatency: 0,
    errorRate: 0,
    infraErrors: 0,
    requestsPerSecond: 0,
    totalRequests: 0,
    blockedRequests: 0,
    timestamp: Date.now(),
};

export const RequestUpdate = (
    blocked: boolean,
    serverError: boolean = false,
    infraError: boolean = false,
    latencyMs: number,
): void => {
    totalRequests++;
    if (blocked) blockedRequests++;
    if (serverError) serverErrors++;
    if (infraError) infraErrors++;
    totalLatency += latencyMs;
};

// Process-level CPU — calc b/w deltas between readings
let prevCpuUsage = process.cpuUsage();
let prevCpuTime = Date.now();

const getProcessCpuPercent = (): number => {
    const now = Date.now();
    const delta = process.cpuUsage(prevCpuUsage);
    const elapsedTime = (now - prevCpuTime) * 1000;
    const usedTime = delta.user + delta.system;

    //update counters
    prevCpuUsage = process.cpuUsage();
    prevCpuTime = now;

    if (elapsedTime <= 0) return 0;
    return Math.min(100, Math.round((usedTime / elapsedTime) * 100));
};

const getMemoryUsage = (): number => {
    const heapUsed = process.memoryUsage().heapUsed;
    return Math.min(100, Math.round((heapUsed / os.totalmem()) * 100));
};

// Snapshot + reset the window
export const collectMetrics = (): SystemMetrics => {
    const now = Date.now();
    const windowSeconds = (now - windowStart) / 1000;

    currentMetrics = {
        cpuUsage: getProcessCpuPercent(),
        memoryUsage: getMemoryUsage(),
        avgLatency: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
        errorRate: totalRequests > 0 ? serverErrors / totalRequests : 0,
        infraErrors,
        requestsPerSecond: windowSeconds > 0 ? Math.round(totalRequests / windowSeconds) : 0,
        blockedRequests,
        totalRequests,
        timestamp: now,
    };

    totalRequests = 0;
    blockedRequests = 0;
    serverErrors = 0;
    infraErrors = 0;
    totalLatency = 0;
    windowStart = now;

    return currentMetrics;
};

// Live view — last snapshot merged with in-progress window
export const getMetrics = (): SystemMetrics => {
    const now = Date.now();
    const windowSeconds = (now - windowStart) / 1000;

    return { //get and override
        ...currentMetrics,
        avgLatency: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : currentMetrics.avgLatency,
        errorRate: totalRequests > 0 ? serverErrors / totalRequests : currentMetrics.errorRate,
        requestsPerSecond: windowSeconds > 0 ? +(totalRequests / windowSeconds).toFixed(1) : 0,
        blockedRequests: totalRequests > 0 ? blockedRequests : currentMetrics.blockedRequests,
        totalRequests: totalRequests > 0 ? totalRequests : currentMetrics.totalRequests,
        timestamp: now,
    };
};

let collectionInterval: ReturnType<typeof setInterval> | null = null; // we get nodejs timeout object here as return type

export const startMetricsCollection = (intervalMs: number = 5000): void => {
    if (collectionInterval) return;
    collectionInterval = setInterval(collectMetrics, intervalMs);
};

export const stopMetricsCollection = (): void => {
    if (collectionInterval) {
        clearInterval(collectionInterval);
        collectionInterval = null;
    }
};