import React from "react";
import "./styles/App.css";

function Controls({
  isPlaying,
  setIsPlaying,
  bpm,
  setBpm,
  totalSteps,
  setTotalSteps,
  handleExport,
  handleImport,
  handleReset,
}) {
  return (
    <div className="controls-container">
      <div className="controls">
        <button onClick={() => setIsPlaying(true)} disabled={isPlaying}>
          Play
        </button>
        <button onClick={() => setIsPlaying(false)} disabled={!isPlaying}>
          Stop
        </button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleExport}>Export</button>
        <label htmlFor="import-file">Import</label>
        <input
          id="import-file"
          type="file"
          style={{ display: "none" }}
          onChange={handleImport}
        />
      </div>
      <div className="bpm-control">
        <span>BPM:</span>
        <input
          type="range"
          min="60"
          max="240"
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
        />
        <span>{bpm}</span>
      </div>
      <div className="steps-control">
        <span>Steps:</span>
        <input
          type="number"
          min="1"
          max="256"
          value={totalSteps}
          onChange={(e) => setTotalSteps(parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
}

export default Controls;