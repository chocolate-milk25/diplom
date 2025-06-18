import React, { useState } from 'react';
import EQ from './EQ.jsx';
import Compressor from './Compressor';
import { Reverb } from './Reverb';
import { FiSettings, FiX } from 'react-icons/fi';
import styles from './FxSlot.module.css';

const effectComponents = {
  eq: EQ,
  compressor: Compressor,
  reverb: Reverb
};

export default function FxSlot({ effect, onUpdate, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const EffectComponent = effectComponents[effect.type];

  const handleParamChange = (params) => {
    onUpdate({ ...effect, params });
  };

  return (
    <div className={`${styles.fxSlot} ${isExpanded ? styles.expanded : ''}`}>
      <div 
        className={styles.fxHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.fxName}>
          {effect.type === 'eq' && 'Эквалайзер'}
          {effect.type === 'compressor' && 'Компрессор'}
          {effect.type === 'reverb' && 'Реверберация'}
        </span>
        <div className={styles.fxActions}>
          <button 
            className={styles.fxSettingsButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <FiSettings />
          </button>
          <button 
            className={styles.fxRemoveButton}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <FiX />
          </button>
        </div>
      </div>

      {isExpanded && EffectComponent && (
        <div className={styles.fxContent}>
          <EffectComponent 
            params={effect.params} 
            onUpdate={handleParamChange}
          />
        </div>
      )}
    </div>
  );
}