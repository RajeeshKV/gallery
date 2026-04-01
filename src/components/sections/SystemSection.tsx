export function SystemSection() {
  return (
    <section className="system-section" id="systems">
      <div className="system-card">
        <div className="system-card__dot" />
        <h3>System Specification</h3>
        <div className="system-list">
          <div>
            <span>OPTICS_ARRAY</span>
            <strong>35MM / 50MM / 85MM PRIME</strong>
          </div>
          <div>
            <span>SENSOR_OUTPUT</span>
            <strong>61.0 MEGAPIXEL RAW</strong>
          </div>
          <div>
            <span>PROCESSING_KERNEL</span>
            <strong>ADOBE_ARCHITECT_v4.2</strong>
          </div>
          <div>
            <span>GEOLOCATION</span>
            <strong>LAT 40.7128 N / LON 74.0060 W</strong>
          </div>
        </div>
      </div>

      <div className="system-copy" id="archive">
        <p>
          Every frame is a calculation. I treat the camera as an instrument for
          spatial analysis, stripping away noise to reveal the mathematical core
          of our environment.
        </p>
        <a href="#gallery">
          Enter Archive Directory
          <span className="material-icons-outlined">arrow_forward</span>
        </a>
      </div>
    </section>
  );
}
