import type { IncomingMessage, ServerResponse } from "node:http";
import { loadPortfolioAssets } from "../shared/cloudinary.js";

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
  _request: IncomingMessage,
  response: ServerResponse,
) {
  setNoCacheHeaders(response);

  try {
    const portfolio = await loadPortfolioAssets();
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(portfolio));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Cloudinary error";

    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        message,
        fetchedAt: new Date().toISOString(),
        carousel: [],
        gallery: [],
      }),
    );
  }
}
