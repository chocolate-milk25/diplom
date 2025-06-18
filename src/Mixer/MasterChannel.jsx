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

  useEffect(() => {
    if (masterRef.current) {
      applyEffects();
    }
  }, [effects]);

  const applyEffects = () => {
    const { eq, compressor, reverb } = masterRef.current.effects;
    
    effects.forEach(effect => {
      switch(effect.type) {
        case 'eq':
          if (effect.active) {
            eq.low.value = effect.params.low || 0;
            eq.mid.value = effect.params.mid || 0;
            eq.high.value = effect.params.high || 0;
            eq.bypass = false;
          } else {
            eq.bypass = true;
          }
          break;
        case 'compressor':
          if (effect.active) {
            compressor.threshold.value = effect.params.threshold || -24;
            compressor.ratio.value = effect.params.ratio || 4;
            compressor.attack.value = effect.params.attack || 0.003;
            compressor.release.value = effect.params.release || 0.25;
            compressor.bypass = false;
          } else {
            compressor.bypass = true;
          }
          break;
        case 'reverb':
          if (effect.active) {
            reverb.decay = effect.params.decay || 2.5;
            reverb.preDelay = effect.params.preDelay || 0.01;
            reverb.wet.value = effect.params.wet || 0.5;
            reverb.bypass = false;
          } else {
            reverb.bypass = true;
          }
          break;
      }
    });

    onMasterUpdate(effects);
  };

  const toggleEffect = (index) => {
    const newEffects = [...effects];
    newEffects[index].active = !newEffects[index].active;
    setEffects(newEffects);
  };

  const updateEffect = (index, updates) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    setEffects(newEffects);
  };

  return (
    <div className={styles.masterChannel}>
      <h3>Мастер-канал</h3>
      
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