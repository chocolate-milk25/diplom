import React from 'react';
import styles from './Effects.module.css';

const Knob = ({ label, value, min, max, step = 0.01, onChange }) => (
  <div className="vst-knob">
    <div className="knob-label">{label}</div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="knob"
    />
    <div className="knob-value">{value.toFixed(2)}</div>
  </div>
);

export default function Compressor({ params = {}, onUpdate }) {
  const defaultParams = {
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    ...params
  };

  const handleChange = (param, value) => {
    onUpdate({ ...defaultParams, [param]: value });
  };

  return (
    <div className={styles.effectContainer}>
      <h4 className={styles.effectTitle}>Компрессор</h4>
      <div className={styles.effectParams}>
        <Knob
          label="Порог"
          value={defaultParams.threshold}
          min={-60}
          max={0}
          step={1}
          onChange={(val) => handleChange('threshold', val)}
        />
        <Knob
          label="Соотношение"
          value={defaultParams.ratio}
          min={1}
          max={20}
          step={0.1}
          onChange={(val) => handleChange('ratio', val)}
        />
        <Knob
          label="Атака"
          value={defaultParams.attack}
          min={0.001}
          max={1}
          step={0.001}
          onChange={(val) => handleChange('attack', val)}
        />
        <Knob
          label="Релиз"
          value={defaultParams.release}
          min={0.01}
          max={2}
          step={0.01}
          onChange={(val) => handleChange('release', val)}
        />
      </div>
    </div>
  );
}