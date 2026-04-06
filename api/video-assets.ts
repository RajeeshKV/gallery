import type { IncomingMessage, ServerResponse } from "node:http";
import { loadVideoPage } from "../shared/cloudinary.js";

function setNoCacheHeaders(response: ServerResponse) {
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  response.setHeader("Surrogate-Control", "no-store");
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  setNoCacheHeaders(response);

  try {
    const url = new URL(request.url ?? "", "http://localhost");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const videos = await loadVideoPage(cursor);
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(videos));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Cloudinary error";

    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        message,
        items: [],
        nextCursor: null,
        fetchedAt: new Date().toISOString(),
      }),
    );
  }
}
