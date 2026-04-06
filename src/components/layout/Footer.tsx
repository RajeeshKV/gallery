export function Footer() {
  return (
    <footer className="site-footer" id="info">
      <div className="footer-meta">&copy;2026 RAJEESH_KV.ARCHIVE</div>
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

