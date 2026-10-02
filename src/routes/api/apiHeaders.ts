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
  if (!request.headers.has("Origin")) return currentHeaders;
  const origin = request.headers.get("Origin");
  if (!allowedOrigins.includes(origin)) return currentHeaders;
  return {
    ...currentHeaders,
    "Access-Control-Allow-Origin": origin,
  };
}
