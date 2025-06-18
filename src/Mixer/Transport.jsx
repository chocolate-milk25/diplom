import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { FaPlay, FaPause, FaStop, FaRedo } from 'react-icons/fa';
import { FiScissors } from 'react-icons/fi';
import styles from './Transport.module.css';


export default function Transport({ tracks, masterRef, onLoopChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [bpm, setBpm] = useState(120);
  const playersRef = useRef([]);

  const handlePlay = async () => {
    await Tone.start();
    
    playersRef.current = tracks.map(track => {
      const player = new Tone.Player(track.buffer).connect(masterRef.current);
      player.loop = loop;
      return player;
    });

    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();
    setIsPlaying(true);
  };

  const handleStop = () => {
    Tone.Transport.stop();
    playersRef.current.forEach(p => p.dispose());
    setIsPlaying(false);
  };

  const handleBpmChange = (e) => {
    const newBpm = Math.min(300, Math.max(40, parseInt(e.target.value) || 120));
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  return (
    <div className={styles.transportContainer}>
      <div className={styles.transportControls}>
        <button 
          onClick={isPlaying ? () => Tone.Transport.pause() : handlePlay}
          disabled={tracks.length === 0}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={handleStop} disabled={!isPlaying}>
          <FaStop />
        </button>
        <button 
          className={loop ? styles.active : ''}
          onClick={() => setLoop(!loop)}
        >
          <FaRedo />
        </button>
      </div>

      <div className={styles.bpmControl}>
        <label>BPM:</label>
        <input
          type="number"
          min="40"
          max="300"
          value={bpm}
          onChange={handleBpmChange}
        />
      </div>

      <div className={styles.additionalControls}>
        <button>
          <FiScissors /> Разрезать
        </button>
      </div>
    </div>
  );
}