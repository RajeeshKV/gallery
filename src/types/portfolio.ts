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
};

export type PortfolioResponse = {
  carousel: PortfolioAsset[];
  gallery: PortfolioAsset[];
  galleryNextCursor: string | null;
  fetchedAt: string;
};

export type GalleryPageResponse = {
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
