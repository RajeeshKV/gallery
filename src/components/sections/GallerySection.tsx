import { useEffect, useState } from "react";
import { fetchGalleryAssets } from "../../lib/api";
import type { PortfolioAsset } from "../../types/portfolio";

type GallerySectionProps = {
  initialAssets: PortfolioAsset[];
  initialNextCursor: string | null;
  isLoading: boolean;
};

export function GallerySection({
  initialAssets,
  initialNextCursor,
  isLoading,
}: GallerySectionProps) {
  const [items, setItems] = useState(initialAssets);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    setItems(initialAssets);
    setCurrentCursor(null);
    setNextCursor(initialNextCursor);
    setCursorHistory([]);
  }, [initialAssets, initialNextCursor]);

  const handleNext = async () => {
    if (!nextCursor || isPageLoading) {
      return;
    }

    setIsPageLoading(true);

    try {
      const page = await fetchGalleryAssets(nextCursor);
      setCursorHistory((current) => [...current, currentCursor]);
      setItems(page.items);
      setCurrentCursor(nextCursor);
      setNextCursor(page.nextCursor);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handlePrevious = async () => {
    if (cursorHistory.length === 0 || isPageLoading) {
      return;
    }

    setIsPageLoading(true);
    const nextHistory = cursorHistory.slice(0, -1);
    const previousCursor = cursorHistory[cursorHistory.length - 1] ?? undefined;

    try {
      const page = await fetchGalleryAssets(previousCursor ?? undefined);
      setItems(page.items);
      setCurrentCursor(previousCursor ?? null);
      setNextCursor(page.nextCursor);
      setCursorHistory(nextHistory);
    } finally {
      setIsPageLoading(false);
    }
  };

  const paginationControls = (
    <div className="gallery-controls">
      <button
        type="button"
        onClick={() => void handlePrevious()}
        disabled={cursorHistory.length === 0 || isPageLoading}
      >
        Prev
      </button>
      <button
        type="button"
        onClick={() => void handleNext()}
        disabled={!nextCursor || isPageLoading}
      >
        Next
      </button>
    </div>
  );

  return (
    <section className="gallery-section" id="gallery">
      <div className="gallery-header">
        <div>
          <p className="eyebrow">Gallery</p>
          <h3 className="gallery-title">Monochrome Archive</h3>
        </div>
        {paginationControls}
      </div>
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
      {(isLoading || isPageLoading) && (
        <p className="gallery-note">Refreshing gallery from Cloudinary...</p>
      )}
      <div className="gallery-footer-pagination">{paginationControls}</div>
    </section>
  );
}
