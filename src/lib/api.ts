import type { PortfolioResponse } from "../types/portfolio";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function fetchPortfolioAssets(
  signal?: AbortSignal,
): Promise<PortfolioResponse> {
  const cacheBust = Date.now();
  const response = await fetch(
    `${API_BASE_URL}/api/portfolio-assets?ts=${cacheBust}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load Cloudinary assets.");
  }

  return response.json() as Promise<PortfolioResponse>;
}
