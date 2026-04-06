import type {
  FolderConfig,
  MediaPageResponse,
  PortfolioResponse,
} from "../types/portfolio";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function fetchPortfolioAssets(
  signal?: AbortSignal,
): Promise<PortfolioResponse> {
  const cacheBust = Date.now();
  const response = await fetch(buildApiUrl(`/api/portfolio-assets?ts=${cacheBust}`), {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load media assets.");
  }

  return response.json() as Promise<PortfolioResponse>;
}

export async function fetchFolderMetadata(
  folder: "Carousel" | "Gallery",
  signal?: AbortSignal,
): Promise<FolderConfig> {
  const response = await fetch(
    buildApiUrl(`/api/admin-metadata?folder=${folder}&ts=${Date.now()}`),
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
    throw new Error("Unable to load folder metadata.");
  }

  return response.json() as Promise<FolderConfig>;
}

export async function saveFolderMetadata(
  folder: "Carousel" | "Gallery",
  adminKey: string,
  metadata: FolderConfig,
): Promise<FolderConfig> {
  const response = await fetch(buildApiUrl(`/api/admin-metadata?folder=${folder}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Unable to save folder metadata.");
  }

  return response.json() as Promise<FolderConfig>;
}

export async function authenticateAdmin(password: string) {
  const response = await fetch(buildApiUrl("/api/admin-auth"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify({ password }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string }
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Authentication failed.");
  }

  return payload;
}

export async function fetchGalleryAssets(
  cursor?: string,
  signal?: AbortSignal,
): Promise<MediaPageResponse> {
  const search = new URLSearchParams({ ts: Date.now().toString() });
  if (cursor) {
    search.set("cursor", cursor);
  }

  const response = await fetch(buildApiUrl(`/api/gallery-assets?${search.toString()}`), {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load gallery items.");
  }

  return response.json() as Promise<MediaPageResponse>;
}

export async function fetchVideoAssets(
  cursor?: string,
  signal?: AbortSignal,
): Promise<MediaPageResponse> {
  const search = new URLSearchParams({ ts: Date.now().toString() });
  if (cursor) {
    search.set("cursor", cursor);
  }

  const response = await fetch(buildApiUrl(`/api/video-assets?${search.toString()}`), {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load video items.");
  }

  return response.json() as Promise<MediaPageResponse>;
}
