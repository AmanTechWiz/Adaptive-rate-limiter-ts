import { beforeEach, describe, expect, it } from "vitest";
import { RequestUpdate, collectMetrics } from "../core/metricsCollect";

describe("metricsCollect", () => {
    beforeEach(() => {
        collectMetrics(); // flush whatever the previous test left in the window
    });

    it("rolls counters up into a snapshot", () => {
        RequestUpdate(false, false, false, 100);
        RequestUpdate(true, false, false, 300);
        RequestUpdate(false, true, false, 200);
        RequestUpdate(false, false, true, 400);

        const snap = collectMetrics();

        expect(snap.totalRequests).toBe(4);
        expect(snap.blockedRequests).toBe(1);
        expect(snap.infraErrors).toBe(1);
        expect(snap.avgLatency).toBe(250);
        expect(snap.errorRate).toBe(0.25);
    });

    it("starts a fresh window after each snapshot", () => {
        RequestUpdate(true, true, true, 500);
        collectMetrics();

        const empty = collectMetrics();

        expect(empty.totalRequests).toBe(0);
        expect(empty.avgLatency).toBe(0);
        expect(empty.errorRate).toBe(0);
    });
});
