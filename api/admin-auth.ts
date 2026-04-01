import type { IncomingMessage, ServerResponse } from "node:http";

function setNoCacheHeaders(response: ServerResponse) {
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  response.setHeader("Surrogate-Control", "no-store");
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  setNoCacheHeaders(response);

  if (request.method !== "POST") {
    response.statusCode = 405;
    response.setHeader("Allow", "POST");
    response.end();
    return;
  }

  const configuredKey = process.env.ADMIN_PANEL_KEY;
  if (!configuredKey) {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        message: "ADMIN_PANEL_KEY is not configured on the server.",
      }),
    );
    return;
  }

  try {
    const body = await readJsonBody<{ password?: string }>(request);
    const isValid = body.password === configuredKey;

    response.statusCode = isValid ? 200 : 401;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        success: isValid,
        message: isValid ? "Authenticated" : "Incorrect password.",
      }),
    );
  } catch {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ message: "Invalid request body." }));
  }
}
