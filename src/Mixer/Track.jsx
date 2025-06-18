import React, { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import styles from './Track.module.css';
import { FiVolume2, FiVolumeX, FiHeadphones, FiTrash2 } from 'react-icons/fi';
import Waveform from './Waveform.jsx';
import FxSlot from './Effects/FxSlot';

export default function Track({ track, isSelected, onSelect, onUpdate, onRemove, masterRef }) {
  const playerRef = useRef(null);

  const toggleMute = () => onUpdate({ mute: !track.mute });
  const toggleSolo = () => onUpdate({ solo: !track.solo });

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    onUpdate({ volume });
    if (playerRef.current) playerRef.current.volume.value = Tone.gainToDb(volume);
  };

  const handlePanChange = (e) => {
    const pan = parseFloat(e.target.value);
    onUpdate({ pan });
    if (playerRef.current) playerRef.current.pan.value = pan;
  };

  // Инициализация плеера при монтировании
  useEffect(() => {
    playerRef.current = new Tone.Player(track.buffer).connect(masterRef.current);
    return () => playerRef.current.dispose();
  }, [track.buffer]);

  return (
    <div 
      className={`${styles.track} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.trackHeader}>
        <h3 className={styles.trackName}>{track.name}</h3>
        <button className={styles.removeButton} onClick={onRemove}>
          <FiTrash2 />
        </button>
      </div>

      <Waveform buffer={track.buffer} />

      <div className={styles.trackControls}>
        <div className={styles.controlGroup}>
          <label>Громкость</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.volume}
            onChange={handleVolumeChange}
          />
          <span>{Math.round(track.volume * 100)}%</span>
        </div>

        <div className={styles.controlGroup}>
          <label>Панорама</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={track.pan}
            onChange={handlePanChange}
          />
          <span>{track.pan.toFixed(2)}</span>
        </div>

        <div className={styles.toggleButtons}>
          <button 
            className={`${styles.muteButton} ${track.mute ? styles.active : ''}`}
            onClick={toggleMute}
          >
            <FiVolumeX />
          </button>
          <button 
            className={`${styles.soloButton} ${track.solo ? styles.active : ''}`}
            onClick={toggleSolo}
          >
            <FiHeadphones />
          </button>
        </div>
      </div>

      <div className={styles.effectsChain}>
        {track.effects.map((effect, index) => (
          <FxSlot
            key={index}
            effect={effect}
            onUpdate={(updatedEffect) => {
              const newEffects = [...track.effects];
              newEffects[index] = updatedEffect;
              onUpdate({ effects: newEffects });
            }}
            onRemove={() => {
              const newEffects = track.effects.filter((_, i) => i !== index);
              onUpdate({ effects: newEffects });
            }}
          />
        ))}
        <button 
          className={styles.addEffectButton}
          onClick={() => onUpdate({ 
            effects: [...track.effects, { type: 'eq', params: {} }]
          })}
        >
          + Добавить эффект
        </button>
      </div>
    </div>
  );
}