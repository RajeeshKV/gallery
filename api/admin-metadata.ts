import type { IncomingMessage, ServerResponse } from "node:http";
import type { FolderConfigEntry } from "../src/types/portfolio.js";
import { loadFolderMetadata, saveFolderMetadata } from "../shared/cloudinary.js";

const VALID_FOLDERS = new Set(["Carousel", "Gallery"]);

function setNoCacheHeaders(response: ServerResponse) {
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  response.setHeader("Surrogate-Control", "no-store");
}

function getFolderFromUrl(request: IncomingMessage) {
  const url = new URL(request.url ?? "", "http://localhost");
  return url.searchParams.get("folder") ?? "";
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function isAuthorized(request: IncomingMessage) {
  const configuredKey = process.env.ADMIN_PANEL_KEY;
  if (!configuredKey) {
    return false;
  }

  return request.headers["x-admin-key"] === configuredKey;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  setNoCacheHeaders(response);
  const folder = getFolderFromUrl(request);

  if (!VALID_FOLDERS.has(folder)) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ message: "Folder must be Carousel or Gallery." }));
    return;
  }

  if (request.method === "GET") {
    try {
      const metadata = await loadFolderMetadata(folder);
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(metadata));
    } catch (error) {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          message: error instanceof Error ? error.message : "Unable to load metadata.",
        }),
      );
    }

    return;
  }

  if (request.method === "POST") {
    if (!isAuthorized(request)) {
      response.statusCode = 401;
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          message: "Unauthorized. Set ADMIN_PANEL_KEY and send it in x-admin-key.",
        }),
      );
      return;
    }

    try {
      const body = await readJsonBody<{ entries: Record<string, FolderConfigEntry> }>(
        request,
      );
      const metadata = await saveFolderMetadata(folder, body.entries ?? {});
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(metadata));
    } catch (error) {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          message: error instanceof Error ? error.message : "Unable to save metadata.",
        }),
      );
    }

    return;
  }

  response.statusCode = 405;
  response.setHeader("Allow", "GET, POST");
  response.end();
}
