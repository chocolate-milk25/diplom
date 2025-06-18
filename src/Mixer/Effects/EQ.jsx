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
const frequencyBands = [
  { id: 'low', label: 'Низкие', freq: 100, max: 20 },
  { id: 'mid', label: 'Средние', freq: 1000, max: 20 },
  { id: 'high', label: 'Высокие', freq: 5000, max: 20 }
];

export default function EQ({ params = {}, onUpdate }) {
  const handleChange = (band, value) => {
    onUpdate({ 
      ...params, 
      [band]: value 
    });
  };

  return (
    <div className={styles.effectContainer}>
      <h4 className={styles.effectTitle}>Эквалайзер</h4>
      <div className={styles.eqBands}>
        {frequencyBands.map(band => (
          <div key={band.id} className={styles.eqBand}>
            <Knob
              label={band.label}
              value={params[band.id] || 0}
              min={-band.max}
              max={band.max}
              onChange={(val) => handleChange(band.id, val)}
            />
            <span>{band.freq}Hz</span>
          </div>
        ))}
      </div>
    </div>
  );
}