import crypto from "node:crypto";
import type {
  FolderConfig,
  FolderConfigEntry,
  PortfolioAsset,
  PortfolioResponse,
} from "../src/types/portfolio.js";

type CloudinaryResource = {
  asset_id: string;
  public_id: string;
  folder?: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
  display_name?: string;
  context?: {
    custom?: Record<string, string>;
  };
};

type CloudinarySearchResponse = {
  resources: CloudinaryResource[];
};

function readCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    carouselFolder: process.env.CLOUDINARY_CAROUSEL_FOLDER ?? "Carousel",
    galleryFolder: process.env.CLOUDINARY_GALLERY_FOLDER ?? "Gallery",
  };
}

function assertConfig(config: ReturnType<typeof readCloudinaryConfig>) {
  const missing = [
    ["CLOUDINARY_CLOUD_NAME", config.cloudName],
    ["CLOUDINARY_API_KEY", config.apiKey],
    ["CLOUDINARY_API_SECRET", config.apiSecret],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Cloudinary configuration: ${missing.join(", ")}.`,
    );
  }
}

function getAssetBaseName(publicId: string) {
  return publicId.split("/").pop() ?? publicId;
}

function createMetadataUrl(cloudName: string, folder: string) {
  const encodedFolder = folder
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `https://res.cloudinary.com/${cloudName}/raw/upload/${encodedFolder}/config.json`;
}

type RawFolderConfig = Record<string, FolderConfigEntry>;

async function fetchFolderMetadata(folder: string): Promise<FolderConfig | null> {
  const config = readCloudinaryConfig();
  if (!config.cloudName) {
    return null;
  }

  const response = await fetch(`${createMetadataUrl(config.cloudName, folder)}?ts=${Date.now()}`, {
    method: "GET",
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Metadata request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as RawFolderConfig;

  return {
    folder,
    updatedAt: new Date().toISOString(),
    entries: data,
  };
}

async function searchFolder(folder: string, maxResults: number) {
  const config = readCloudinaryConfig();
  assertConfig(config);

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/search`;
  const expression = `resource_type:image AND folder="${folder}"`;
  const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString(
    "base64",
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    body: JSON.stringify({
      expression,
      max_results: maxResults,
      sort_by: [{ created_at: "desc" }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as CloudinarySearchResponse;
}

function toPortfolioAsset(resource: CloudinaryResource): PortfolioAsset {
  const custom = resource.context?.custom ?? {};
  const title = custom.title ?? resource.display_name ?? resource.public_id;
  const description =
    custom.description ?? "Latest asset pulled from Cloudinary.";
  const alt = custom.alt ?? title;

  return {
    id: resource.asset_id,
    publicId: resource.public_id,
    title,
    description,
    alt,
    width: resource.width,
    height: resource.height,
    url: resource.secure_url,
    secureUrl: resource.secure_url,
    format: resource.format,
    folder: resource.folder ?? "",
    createdAt: resource.created_at,
  };
}

function mergeMetadata(
  resources: CloudinaryResource[],
  metadata: FolderConfig | null,
) {
  return resources.map((resource) => {
    const asset = toPortfolioAsset(resource);
    const baseName = getAssetBaseName(resource.public_id);
    const overrides =
      metadata?.entries[baseName] ??
      Object.values(metadata?.entries ?? {}).find((entry) =>
        entry.imageName?.startsWith(baseName),
      );

    if (!overrides) {
      return asset;
    }

    return {
      ...asset,
      title: overrides.name || asset.title,
      alt: overrides.name || asset.alt,
      description: overrides.description || asset.description,
    };
  });
}

export async function loadPortfolioAssets(): Promise<PortfolioResponse> {
  const config = readCloudinaryConfig();

  const [carouselResult, galleryResult, carouselMetadata, galleryMetadata] =
    await Promise.all([
    searchFolder(config.carouselFolder, 10),
    searchFolder(config.galleryFolder, 24),
      fetchFolderMetadata(config.carouselFolder),
      fetchFolderMetadata(config.galleryFolder),
    ]);

  return {
    carousel: mergeMetadata(carouselResult.resources, carouselMetadata),
    gallery: mergeMetadata(galleryResult.resources, galleryMetadata),
    fetchedAt: new Date().toISOString(),
  };
}

export async function loadFolderMetadata(folder: string): Promise<FolderConfig> {
  const metadata = await fetchFolderMetadata(folder);

  return (
    metadata ?? {
      folder,
      updatedAt: new Date().toISOString(),
      entries: {},
    }
  );
}

function signUploadParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function saveFolderMetadata(
  folder: string,
  entries: Record<string, FolderConfigEntry>,
): Promise<FolderConfig> {
  const config = readCloudinaryConfig();
  assertConfig(config);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = "config";
  const params = {
    folder,
    invalidate: "true",
    overwrite: "true",
    public_id: publicId,
    timestamp,
  };

  const signature = signUploadParams(params, config.apiSecret!);
  const body = new FormData();
  const metadata: FolderConfig = {
    folder,
    updatedAt: new Date().toISOString(),
    entries,
  };

  body.append(
    "file",
    new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" }),
    "config.json",
  );
  body.append("api_key", config.apiKey!);
  body.append("timestamp", timestamp);
  body.append("public_id", publicId);
  body.append("folder", folder);
  body.append("overwrite", "true");
  body.append("invalidate", "true");
  body.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/raw/upload`,
    {
      method: "POST",
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      body,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Metadata upload failed: ${response.status} ${errorText}`);
  }

  return metadata;
}
