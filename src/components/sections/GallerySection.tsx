import type { PortfolioAsset } from "../../types/portfolio";

type GallerySectionProps = {
  assets: PortfolioAsset[];
  isLoading: boolean;
};

export function GallerySection({ assets, isLoading }: GallerySectionProps) {
  const items = assets.slice(0, 16);

  return (
    <section className="gallery-section" id="gallery">
      <div className="gallery-grid">
        {items.length > 0
          ? items.map((asset, index) => (
              <article className="gallery-card" key={asset.id}>
                <img src={asset.url} alt={asset.alt} loading="lazy" />
                <div className="gallery-card__overlay" />
                <div className="gallery-card__meta">
                  <span>SYS_REF: {(index + 1).toString().padStart(3, "0")}</span>
                </div>
              </article>
            ))
          : Array.from({ length: 8 }, (_, index) => (
              <div className="gallery-card gallery-card--placeholder" key={index}>
                <div />
              </div>
            ))}
      </div>
      {isLoading && <p className="gallery-note">Refreshing gallery from Cloudinary...</p>}
    </section>
  );
}
