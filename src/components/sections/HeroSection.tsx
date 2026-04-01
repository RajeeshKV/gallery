import { useEffect, useMemo, useState } from "react";
import type { PortfolioAsset } from "../../types/portfolio";

type HeroSectionProps = {
  slides: PortfolioAsset[];
  isLoading: boolean;
  error: string | null;
};

const FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=80",
    title: "Raw Frames Gallery",
    alt: "Monochrome architecture",
    description: "Awaiting Cloudinary carousel assets",
  },
];

export function HeroSection({ slides, isLoading, error }: HeroSectionProps) {
  const displaySlides = useMemo(
    () => (slides.length > 0 ? slides : FALLBACK_SLIDES),
    [slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (displaySlides.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % displaySlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [displaySlides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [displaySlides.length]);

  return (
    <section className="hero-section">
      <div className="hero-carousel">
        {displaySlides.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-slide ${index === activeIndex ? "is-active" : ""}`}
            aria-hidden={index !== activeIndex}
          >
            <img src={slide.url} alt={slide.alt} className="hero-image" />
            <div className="hero-overlay" />
            <div className="hero-scanline" />
          </article>
        ))}
      </div>

      <div className="hero-status">
        <div>
          <div className="status-bar">
            <span />
          </div>
          <p>System Online: 200 OK</p>
        </div>
        <div className="scroll-indicator">
          <span>SCROLL_TO_EXPLORE</span>
          <div className="scroll-line">
            <i />
          </div>
        </div>
      </div>

      <div className="hero-copy">
        <div>
          <p className="eyebrow">RAJEESH KV</p>
          <h1>{displaySlides[activeIndex]?.title ?? "Architectural Stories"}</h1>
          <p className="hero-description">
            {displaySlides[activeIndex]?.description ??
              "RAW FRAMES GALLERY presents monochrome studies of light, structure, and stillness."}
          </p>
        </div>
        <div className="hero-dots">
          {displaySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {(isLoading || error) && (
        <div className="hero-toast" role="status">
          {isLoading ? "Syncing latest Cloudinary assets..." : error}
        </div>
      )}

      {isLoading && slides.length === 0 && (
        <div className="hero-loading-panel" aria-hidden="true">
          <div className="admin-skeleton admin-skeleton--title" />
          <div className="admin-skeleton" />
          <div className="admin-skeleton" />
        </div>
      )}
    </section>
  );
}
