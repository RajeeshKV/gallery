export type PortfolioAsset = {
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
  mediaType: "image" | "video";
  thumbnailUrl: string;
  playbackUrl: string;
  duration?: number;
};

export type PortfolioResponse = {
  carousel: PortfolioAsset[];
  gallery: PortfolioAsset[];
  galleryNextCursor: string | null;
  videos: PortfolioAsset[];
  videosNextCursor: string | null;
  fetchedAt: string;
};

export type MediaPageResponse = {
  items: PortfolioAsset[];
  nextCursor: string | null;
  fetchedAt: string;
};

export type FolderConfigEntry = {
  name: string;
  description?: string;
  imageName?: string;
};

export type FolderConfig = {
  folder: string;
  updatedAt: string;
  entries: Record<string, FolderConfigEntry>;
};
