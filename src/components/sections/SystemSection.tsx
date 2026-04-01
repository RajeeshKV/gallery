export function SystemSection() {
  return (
    <section className="system-section" id="systems">
      <div className="system-card">
        <div className="system-card__dot" />
        <h3>System Specification</h3>
        <div className="system-list">
          <div>
            <span>PHOTOGRAPHER</span>
            <strong>RAJEESH KV</strong>
          </div>
          <div>
            <span>CAMERA_BODY</span>
            <strong>IPHONE 17 PRO</strong>
          </div>
          <div>
            <span>PRIMARY_LENS</span>
            <strong>48MM</strong>
          </div>
          <div>
            <span>PREVIOUS_SETUP</span>
            <strong>SAMSUNG S23</strong>
          </div>
          <div>
            <span>EDITING_FLOW</span>
            <strong>ADOBE LIGHTROOM / SNAPSEED</strong>
          </div>
        </div>
      </div>

      <div className="system-copy" id="archive">
        <p>
          I photograph with the iPhone 17 Pro using the 48mm lens, moving from my
          earlier Samsung S23 setup into a cleaner, more deliberate framing style.
          Adobe Lightroom and Snapseed shape the final monochrome finish.
        </p>
        <a
          href="https://www.instagram.com/rawframesgallery"
          target="_blank"
          rel="noreferrer"
        >
          Enter Archive Directory
          <span className="material-icons-outlined">arrow_forward</span>
        </a>
      </div>
    </section>
  );
}
