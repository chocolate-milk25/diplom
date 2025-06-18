import React, { useState } from 'react';
import { FiSettings, FiX, FiPower } from 'react-icons/fi';
import styles from './FxSlot.module.css';

const effectComponents = {
  eq: React.lazy(() => import('./EQ')),
  compressor: React.lazy(() => import('./Compressor')),
  reverb: React.lazy(() => import('./Reverb'))
};

export default function FxSlot({ effect, onUpdate, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const EffectComponent = effectComponents[effect.type];

  const handleParamChange = (params) => {
    onUpdate({ ...effect, params });
  };

  const toggleActive = () => {
    onUpdate({ ...effect, active: !effect.active });
  };

  return (
    <div className={`${styles.fxSlot} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.fxHeader}>
        <div 
          className={styles.fxTitle}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <button 
            className={`${styles.activeToggle} ${effect.active ? styles.active : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleActive();
            }}
          >
            <FiPower />
          </button>
          <span className={styles.fxName}>
            {effect.type === 'eq' && 'Эквалайзер'}
            {effect.type === 'compressor' && 'Компрессор'}
            {effect.type === 'reverb' && 'Реверберация'}
          </span>
        </div>
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
        <React.Suspense fallback={<div>Загрузка...</div>}>
          <div className={styles.fxContent}>
            <EffectComponent 
              params={effect.params || {}} 
              onUpdate={handleParamChange}
            />
          </div>
        </React.Suspense>
      )}
    </div>
  );
}