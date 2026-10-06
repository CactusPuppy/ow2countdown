export function setCacheControl(
  currentHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    ...currentHeaders,
    "cache-control": "public, max-age=60",
  };
}

export const allowedOrigins = [
  "https://overwatch.weirdgloop.org",
  "https://overwatch.wiki",
];

export function handleCORS(
  request: Request,
  currentHeaders: Record<string, string>,
): Record<string, string> {
  const varyHeaders = {
    ...currentHeaders,
    Vary: currentHeaders.Vary ? `${currentHeaders.Vary}, Origin` : "Origin",
  };
  const origin = request.headers.get("Origin");
  if (origin === null || !allowedOrigins.includes(origin)) return varyHeaders;
  return {
    ...varyHeaders,
    "Access-Control-Allow-Origin": origin,
  };
}
