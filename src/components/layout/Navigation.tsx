type NavigationProps = {
  isVisible: boolean;
};

export function Navigation({ isVisible }: NavigationProps) {
  return (
    <nav className={`sticky-nav ${isVisible ? "visible" : ""}`}>
      <div className="brand-mark">THE ARCHITECT</div>
      <div className="nav-links">
        <a href="#gallery">Projects</a>
        <a href="#systems">Systems</a>
        <a href="#archive">Archive</a>
        <a href="#info">Info</a>
      </div>
      <button className="mobile-nav-button" type="button" aria-label="Menu">
        <span className="material-icons-outlined">menu</span>
      </button>
    </nav>
  );
}
