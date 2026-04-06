import { useEffect, useState } from "react";

type NavigationProps = {
  isVisible: boolean;
};

const NAV_ITEMS = [
  { label: "Gallery", target: "gallery" },
  { label: "Videos", target: "videos" },
  { label: "Systems", target: "systems" },
  { label: "Archive", target: "archive" },
] as const;

export function Navigation({ isVisible }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isVisible) {
      setIsMenuOpen(false);
    }
  }, [isVisible]);

  const scrollToTarget = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    const navOffset = 88;
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset;

    window.history.replaceState(null, "", `#${targetId}`);
    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
    setIsMenuOpen(false);
  };

  return (
    <nav className={`sticky-nav ${isVisible ? "visible" : ""}`}>
      <button
        className="brand-mark brand-mark--button"
        type="button"
        onClick={() => scrollToTarget("home")}
      >
        ARCHIVE
      </button>
      <div className="nav-links">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.target}
            type="button"
            className="nav-link-button"
            onClick={() => scrollToTarget(item.target)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        className="mobile-nav-button"
        type="button"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span className="material-icons-outlined">
          {isMenuOpen ? "close" : "menu"}
        </span>
      </button>
      <div
        id="mobile-navigation"
        className={`mobile-nav-panel ${isMenuOpen ? "is-open" : ""}`}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.target}
            type="button"
            className="mobile-nav-link"
            onClick={() => scrollToTarget(item.target)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
