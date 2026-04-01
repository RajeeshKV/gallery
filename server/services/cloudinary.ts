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

type PortfolioAsset = {
  id: string;
  publicId: string;
  title: string;
  description: string;
  alt: string;
  width: number;
  height: number;
  url: string;
  secureUrl: string;
  format: string;
  folder: string;
  createdAt: string;
};

type PortfolioResponse = {
  carousel: PortfolioAsset[];
  gallery: PortfolioAsset[];
  fetchedAt: string;
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const carouselFolder = process.env.CLOUDINARY_CAROUSEL_FOLDER ?? "Carousel";
const galleryFolder = process.env.CLOUDINARY_GALLERY_FOLDER ?? "Gallery";

function assertConfig() {
  const missing = [
    ["CLOUDINARY_CLOUD_NAME", cloudName],
    ["CLOUDINARY_API_KEY", apiKey],
    ["CLOUDINARY_API_SECRET", apiSecret],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Cloudinary configuration: ${missing.join(", ")}.`,
    );
  }
}

async function searchFolder(folder: string, maxResults: number) {
  assertConfig();

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;
  const expression = `resource_type:image AND folder="${folder}"`;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

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

export async function loadPortfolioAssets(): Promise<PortfolioResponse> {
  const [carouselResult, galleryResult] = await Promise.all([
    searchFolder(carouselFolder, 10),
    searchFolder(galleryFolder, 24),
  ]);

  return {
    carousel: carouselResult.resources.map(toPortfolioAsset),
    gallery: galleryResult.resources.map(toPortfolioAsset),
    fetchedAt: new Date().toISOString(),
  };
}
