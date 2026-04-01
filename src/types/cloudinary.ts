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
  fetchedAt: string;
};
