import React, { useEffect, useState } from "react";

const Compressor = ({ compressor }) => {
  const defaultSettings = {
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
    knee: 30,
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (!compressor) return;
    setSettings({
      threshold: compressor.threshold.value,
      ratio: compressor.ratio.value,
      attack: compressor.attack.value,
      release: compressor.release.value,
      knee: compressor.knee.value,
    });
  }, [compressor]);

  const handleChange = (param, value) => {
    if (!compressor) return;
    if (compressor[param] instanceof AudioParam) {
      compressor[param].value = value;
      setSettings((prev) => ({ ...prev, [param]: value }));
    }
  };

  const sliders = [
    { param: "threshold", min: -100, max: 0, step: 1 },
    { param: "ratio", min: 1, max: 20, step: 0.1 },
    { param: "attack", min: 0, max: 1, step: 0.001 },
    { param: "release", min: 0, max: 1, step: 0.001 },
    { param: "knee", min: 0, max: 40, step: 1 },
  ];

  if (!compressor) return null;

  return (
    <div style={{ marginTop: "30px", textAlign: "center" }}>
      <h3 style={{ color: "#fff" }}>Compressor</h3>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
        {sliders.map(({ param, min, max, step }) => (
          <div key={param} style={{ textAlign: "center" }}>
            <label style={{ color: "#ccc" }}>{param}</label>
            <input
              type="range"
              value={settings[param]}
              min={min}
              max={max}
              step={step}
              onChange={(e) => handleChange(param, parseFloat(e.target.value))}
              style={{ writingMode: "bt-lr", height: "120px" }}
            />
            <div style={{ color: "#aaa", fontSize: "13px" }}>
              {settings[param].toFixed(3)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Compressor;
