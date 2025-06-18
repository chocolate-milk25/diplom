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
export default function Reverb({ params = {}, onUpdate }) {
  const defaultParams = {
    decay: 2.5,
    preDelay: 0.01,
    wet: 0.5,
    ...params
  };

  const handleChange = (param, value) => {
    onUpdate({ ...defaultParams, [param]: value });
  };

  return (
    <div className={styles.effectContainer}>
      <h4 className={styles.effectTitle}>Реверберация</h4>
      <div className={styles.effectParams}>
        <Knob
          label="Декей"
          value={defaultParams.decay}
          min={0.1}
          max={10}
          step={0.1}
          onChange={(val) => handleChange('decay', val)}
        />
        <Knob
          label="Предзадержка"
          value={defaultParams.preDelay}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(val) => handleChange('preDelay', val)}
        />
        <Knob
          label="Эффект"
          value={defaultParams.wet}
          min={0}
          max={1}
          step={0.01}
          onChange={(val) => handleChange('wet', val)}
        />
      </div>
    </div>
  );
}