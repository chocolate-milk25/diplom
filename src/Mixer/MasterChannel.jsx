// MasterChannel.jsx
import React, { useState, useEffect } from 'react';
import EQ from './Effects/EQ';
import Compressor from './Effects/Compressor';
import { Reverb } from './Effects/Reverb';
import styles from './MasterChannel.module.css';

export default function MasterChannel({ masterRef, onMasterUpdate }) {
  const [effects, setEffects] = useState([
    { type: 'eq', active: true, params: { low: 0, mid: 0, high: 0 } },
    { type: 'compressor', active: true, params: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25 } },
    { type: 'reverb', active: false, params: { decay: 2.5, preDelay: 0.01, wet: 0.5 } }
  ]);

  const toggleEffect = (index) => {
    const newEffects = [...effects];
    newEffects[index].active = !newEffects[index].active;
    setEffects(newEffects);
    onMasterUpdate(newEffects);
  };

  const updateEffect = (index, updates) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    setEffects(newEffects);
    onMasterUpdate(newEffects);
  };

  return (
    <div className={styles.masterChannel}>
      <h3>Мастер-канал</h3>
      <div className={styles.masterVolume}>
        <label>Громкость:</label>
        <input
          type="range"
          min="-60"
          max="0"
          step="1"
          value={masterRef.current?.channel.volume.value || 0}
          onChange={(e) => {
            if (masterRef.current) {
              masterRef.current.channel.volume.value = parseFloat(e.target.value);
            }
          }}
        />
        <span>{masterRef.current?.channel.volume.value.toFixed(1)} dB</span>
      </div>
      
      <div className={styles.masterEffects}>
        {effects.map((effect, index) => (
          <div 
            key={index} 
            className={`${styles.masterEffect} ${effect.active ? styles.active : ''}`}
          >
            <div className={styles.effectHeader} onClick={() => toggleEffect(index)}>
              <h4>
                {effect.type === 'eq' && 'EQ'}
                {effect.type === 'compressor' && 'Compressor'}
                {effect.type === 'reverb' && 'Reverb'}
              </h4>
              <div className={styles.effectToggle}>
                {effect.active ? 'ON' : 'OFF'}
              </div>
            </div>
            
            {effect.active && (
              <div className={styles.effectControls}>
                {effect.type === 'eq' && (
                  <EQ 
                    params={effect.params} 
                    onUpdate={(updates) => updateEffect(index, { params: updates })}
                  />
                )}
                {effect.type === 'compressor' && (
                  <Compressor 
                    params={effect.params} 
                    onUpdate={(updates) => updateEffect(index, { params: updates })}
                  />
                )}
                {effect.type === 'reverb' && (
                  <Reverb 
                    params={effect.params} 
                    onUpdate={(updates) => updateEffect(index, { params: updates })}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}