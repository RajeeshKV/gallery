export function Footer() {
  return (
    <footer className="site-footer" id="info">
      <div className="footer-meta">©2026 RAJEESH_KV.RAW_FRAMES_GALLERY</div>
      <div className="footer-links">
        <a
          href="https://www.instagram.com/rawframesgallery"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
      </div>
      <div className="signal-meter">
        <span>PHOTOGRAPHY_SIGNAL: OPTIMAL</span>
        <div className="signal-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i className="is-muted" />
        </div>
      </div>
    </footer>
  );
}
