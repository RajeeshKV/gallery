import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(
  _request: IncomingMessage,
  response: ServerResponse,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.setHeader("Content-Type", "application/json");
  response.statusCode = 200;
  response.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
}
