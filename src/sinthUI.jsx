import React, { useState } from "react";
import "./SynthUI.css";

function Knob({ label }) {
  return (
    <div className="knob-wrapper">
      <div className="knob">
        <div className="knob-indicator"></div>
      </div>
      <div className="knob-label">{label}</div>
    </div>
  );
}

function SliderWithTicks({ label, min, max, step, value, onChange }) {
  const ticksCount = Math.floor((max - min) / step);
  return (
    <div className="slider-container">
      <label className="slider-label">{label}</label>
      <div className="slider-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="slider"
        />
        <div className="slider-ticks">
          {Array.from({ length: ticksCount + 1 }).map((_, i) => (
            <div key={i} className="tick"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SynthUI() {
  const [detune, setDetune] = useState(0);

  return (
    <div className="container">
      {/* Oscillators */}
      <div className="block">
        <div className="header">Oscillators</div>
        <div className="knobs-row">
          <Knob label="OSC 1" />
          <Knob label="OSC 2" />
          <Knob label="OSC 3" />
        </div>
      </div>

      {/* Filter */}
      <div className="block">
        <div className="header">Filter</div>
        <SliderWithTicks label="Cutoff" min={20} max={20000} step={500} value={1000} onChange={() => {}} />
        <SliderWithTicks label="Resonance" min={0} max={10} step={0.1} value={0} onChange={() => {}} />
      </div>

      {/* Envelope */}
      <div className="block">
        <div className="header">Envelope</div>
        <SliderWithTicks label="Attack" min={0} max={5} step={0.01} value={0} onChange={() => {}} />
        <SliderWithTicks label="Decay" min={0} max={5} step={0.01} value={0} onChange={() => {}} />
        <SliderWithTicks label="Sustain" min={0} max={1} step={0.01} value={1} onChange={() => {}} />
        <SliderWithTicks label="Release" min={0} max={5} step={0.01} value={0} onChange={() => {}} />
      </div>

      {/* Waveform & Piano */}
      <div className="block waveform-piano-block">
        <div className="waveform-block">
          <div className="header">Waveform</div>
          <div className="waveform-canvas">
            {/* Здесь может быть Canvas с отрисовкой волны */}
          </div>
        </div>

        <div className="piano-block">
          <div className="header">Piano</div>
          <div className="piano-keys">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="piano-key"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
