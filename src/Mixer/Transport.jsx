import React, { useState } from 'react';
import * as Tone from 'tone';
import { FaPlay, FaPause, FaStop, FaRedo } from 'react-icons/fa';
import styles from './Transport.module.css';

export default function Transport({ isPlaying, onPlay, onPause, onStop, onToggleLoop }) {
  const [loop, setLoop] = useState(false);

  const handleLoopToggle = () => {
    setLoop(!loop);
    onToggleLoop(!loop);
  };

  return (
    <div className={styles.transportContainer}>
      <button 
        onClick={isPlaying ? onPause : onPlay}
        className={styles.transportButton}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <button 
        onClick={onStop}
        className={styles.transportButton}
      >
        <FaStop />
      </button>
      <button 
        className={`${styles.transportButton} ${loop ? styles.active : ''}`}
        onClick={handleLoopToggle}
      >
        <FaRedo />
      </button>
    </div>
  );
}