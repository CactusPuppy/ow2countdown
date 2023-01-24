import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, type Metric } from "web-vitals";

const vitalsURL = "https://vitals.vercel-analytics.com/v1/vitals";

function getConnectionSpeed() {
  return "connection" in navigator &&
    navigator["connection"] &&
    "effectiveType" in <Record<string, unknown>>navigator["connection"]
      ? navigator["connection"]["effectiveType"]
      : "";
}

export interface MetricsOptions {
  params: { [s: string]: unknown; } | ArrayLike<unknown>;
  path: string;
  analyticsID: string;
  debug: boolean;
}

function sendToAnalytics(metric: Metric, options: MetricsOptions) {
  const page = Object.entries(options.params).reduce(
    (acc, [key, value]) => acc.replace(value.toString(), `[${key}]`),
    options.path ?? ""
  );

  const body = {
    dsn: options.analyticsID,
    id: metric.id,
    page,
    href: location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed()
  };

  if (options.debug) {
    console.log('[Analytics]', metric.name, JSON.stringify(body, null, 2));
  }

  const blob = new Blob([new URLSearchParams(body).toString()], {
    // This content type is necessary for `sendBeacon`
    type: "application/x-www-form-urlencoded"
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsURL, blob);
  } else {
    fetch(vitalsURL, {
      body: blob,
      method: "POST",
      credentials: "omit",
      keepalive: true
    });
  }
}

export function webVitals(options: MetricsOptions) {
  try {
    onFID((metric: Metric) => sendToAnalytics(metric, options));
    onTTFB((metric: Metric) => sendToAnalytics(metric, options));
    onLCP((metric: Metric) => sendToAnalytics(metric, options));
    onCLS((metric: Metric) => sendToAnalytics(metric, options));
    onFCP((metric: Metric) => sendToAnalytics(metric, options));
    onINP((metric: Metric) => sendToAnalytics(metric, options));
  } catch (err) {
    console.error("[Analytics]", err);
  }
}
