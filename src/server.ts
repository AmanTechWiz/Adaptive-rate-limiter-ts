import { createApp } from "./app";
import { startMetricsCollection } from "./core/metricsCollect";
import { startAdaptiveThrottling } from "./core/adaptiveThrottle";
import { getAdaptiveConfig } from "./config/configService";

const PORT = Number(process.env.PORT ?? 3000);

startMetricsCollection(getAdaptiveConfig().evaluationIntervalMs);
startAdaptiveThrottling();

createApp().listen(PORT,()=>{
    console.log(`Server is listening on http://localhost:${PORT}`);
})
