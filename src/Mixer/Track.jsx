import React, { useRef, useEffect, useState } from 'react';
import * as Tone from 'tone';
import styles from './Track.module.css';
import { FiVolume2, FiVolumeX, FiHeadphones, FiTrash2, FiPlay, FiSquare } from 'react-icons/fi';
import Waveform from './Waveform';
import FxSlot from './Effects/FxSlot';

export default function Track({ track, isSelected, onSelect, onUpdate, onRemove, masterRef }) {
  const playerRef = useRef(null);
  const effectNodesRef = useRef([]);
  const outputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    playerRef.current = new Tone.Player(track.buffer).toDestination();
    playerRef.current.autostart = false;
    
    playerRef.current.onstop = () => setIsPlaying(false);
    playerRef.current.onended = () => setIsPlaying(false);

    setupAudioGraph();

    return () => {
      playerRef.current?.dispose();
      effectNodesRef.current.forEach(node => node.dispose());
      outputRef.current?.dispose();
    };
  }, [track.buffer]);

  useEffect(() => {
    setupAudioGraph();
  }, [track.effects, track.volume, track.pan, track.mute, track.solo]);

  const setupAudioGraph = () => {
    if (!playerRef.current) return;

    playerRef.current.disconnect();
    effectNodesRef.current.forEach(node => node.dispose());
    effectNodesRef.current = [];

    const nodes = track.effects.map(createEffectNode).filter(Boolean);
    effectNodesRef.current = nodes;

    outputRef.current = new Tone.Channel({
      volume: Tone.gainToDb(track.volume),
      pan: track.pan,
      mute: track.mute,
      solo: track.solo,
    }).connect(masterRef.current.channel);

    playerRef.current.chain(...nodes, outputRef.current);
  };

  const createEffectNode = (effect) => {
    switch (effect.type) {
      case 'eq': return new Tone.EQ3(effect.params);
      case 'compressor': return new Tone.Compressor(effect.params);
      case 'reverb': return new Tone.Reverb(effect.params);
      default: return null;
    }
  };

  const playTrack = async () => {
    await Tone.start();
    if (playerRef.current && playerRef.current.state !== 'started') {
      playerRef.current.start();
      setIsPlaying(true);
    }
    outputRef.current.mute = false;
    outputRef.current.solo = false;
    onUpdate({ mute: false, solo: false });
  };

  const stopTrack = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const newMute = !track.mute;
    onUpdate({ mute: newMute });
  };

  const toggleSolo = (e) => {
    e.stopPropagation();
    const newSolo = !track.solo;
    onUpdate({ solo: newSolo });
  };

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    onUpdate({ volume });
  };

  const handlePanChange = (e) => {
    const pan = parseFloat(e.target.value);
    onUpdate({ pan });
  };

  return (
    <div 
      className={`${styles.track} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.trackHeader}>
        <h3 className={styles.trackName}>{track.name}</h3>
        <div>
          {isPlaying ? (
            <button 
              className={`${styles.stopButton} ${styles.controlButton}`}
              onClick={(e) => {
                e.stopPropagation();
                stopTrack();
              }}
            >
              <FiSquare />
            </button>
          ) : (
            <button 
              className={`${styles.playButton} ${styles.controlButton}`}
              onClick={(e) => {
                e.stopPropagation();
                playTrack();
              }}
            >
              <FiPlay />
            </button>
          )}
          <button 
            className={`${styles.removeButton} ${styles.controlButton}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <FiTrash2 />
          </button>
        </div>
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
            {track.mute ? <FiVolumeX /> : <FiVolume2 />}
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
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ 
              effects: [...track.effects, { type: 'eq', params: { low: 0, mid: 0, high: 0 } }]
            });
          }}
        >
          + Добавить эффект
        </button>
      </div>
    </div>
  );
}