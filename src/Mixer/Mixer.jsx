// Mixer.jsx
import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import Track from './Track';
import MasterChannel from './MasterChannel';
import Transport from './Transport';
import { FiUpload, FiDownload, FiPlus, FiTrash2 } from 'react-icons/fi';
import styles from './Mixer.module.css';

export default function Mixer({ masterVolume }) {
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const masterRef = useRef(null);
  const [masterEffects, setMasterEffects] = useState([]);

  // Инициализация мастер-канала
  useEffect(() => {
    const masterChannel = new Tone.Channel({
      volume: Tone.gainToDb(masterVolume),
      pan: 0
    }).toDestination();
    
    // Инициализация эффектов мастер-канала
    const eq = new Tone.EQ3().connect(masterChannel);
    const compressor = new Tone.Compressor().connect(masterChannel);
    const reverb = new Tone.Reverb().connect(masterChannel);
    
    masterRef.current = {
      channel: masterChannel,
      effects: { eq, compressor, reverb }
    };

    return () => {
      masterChannel.dispose();
      eq.dispose();
      compressor.dispose();
      reverb.dispose();
    };
  }, [masterVolume]);

  const addTrack = async (file) => {
    try {
      const buffer = await Tone.Buffer.fromFile(URL.createObjectURL(file));
      const newTrack = {
        id: Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        buffer,
        volume: 0.8,
        pan: 0,
        mute: false,
        solo: false,
        effects: [],
        startTime: 0,
        endTime: buffer.duration
      };
      setTracks([...tracks, newTrack]);
    } catch (error) {
      console.error('Error loading audio file:', error);
    }
  };

  const removeTrack = (id) => {
    setTracks(tracks.filter(track => track.id !== id));
    if (selectedTrack === id) setSelectedTrack(null);
  };

  const updateTrack = (id, updates) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const handleMasterEffectsUpdate = (effects) => {
    setMasterEffects(effects);
    applyMasterEffects(effects);
  };

  const applyMasterEffects = (effects) => {
    if (!masterRef.current) return;
    
    const { eq, compressor, reverb } = masterRef.current.effects;
    
    effects.forEach(effect => {
      switch(effect.type) {
        case 'eq':
          if (effect.active) {
            eq.low.value = effect.params.low || 0;
            eq.mid.value = effect.params.mid || 0;
            eq.high.value = effect.params.high || 0;
          }
          break;
        case 'compressor':
          if (effect.active) {
            compressor.threshold.value = effect.params.threshold || -24;
            compressor.ratio.value = effect.params.ratio || 4;
            compressor.attack.value = effect.params.attack || 0.003;
            compressor.release.value = effect.params.release || 0.25;
          }
          break;
        case 'reverb':
          if (effect.active) {
            reverb.decay = effect.params.decay || 2.5;
            reverb.preDelay = effect.params.preDelay || 0.01;
            reverb.wet.value = effect.params.wet || 0.5;
          }
          break;
      }
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.match('audio.*')) addTrack(file);
    });
  };

  return (
    <div className={styles.mixerContainer}>
      <div className={styles.toolbar}>
        <button 
          className={styles.toolbarButton}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <FiPlus /> Добавить трек
        </button>
        <input
          id="file-upload"
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <Transport tracks={tracks} masterRef={masterRef} />
      </div>

      <div className={styles.tracksContainer}>
        {tracks.map(track => (
          <Track
            key={track.id}
            track={track}
            isSelected={selectedTrack === track.id}
            onSelect={() => setSelectedTrack(track.id)}
            onUpdate={(updates) => updateTrack(track.id, updates)}
            onRemove={() => removeTrack(track.id)}
            masterRef={masterRef}
          />
        ))}
      </div>

      <MasterChannel 
        masterRef={masterRef} 
        onMasterUpdate={handleMasterEffectsUpdate}
      />
    </div>
  );
}