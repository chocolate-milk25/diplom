import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import Track from './Track';
import MasterChannel from './MasterChannel';
import Transport from './Transport';
import { FiPlus, FiDownload } from 'react-icons/fi';
import styles from './Mixer.module.css';

export default function Mixer({ masterVolume }) {
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const masterRef = useRef(null);
  const playersRef = useRef([]);

  useEffect(() => {
    const masterChannel = new Tone.Channel({
      volume: Tone.gainToDb(masterVolume),
      pan: 0
    }).toDestination();
    
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
      stopAllPlayers();
    };
  }, [masterVolume]);

  const stopAllPlayers = () => {
    playersRef.current.forEach(player => player.stop().dispose());
    playersRef.current = [];
    setIsPlaying(false);
  };

  const playAllTracks = async () => {
    await Tone.start();
    stopAllPlayers();
    
    const newPlayers = tracks.map(track => {
      const player = new Tone.Player(track.buffer)
        .connect(masterRef.current.channel);
      player.start();
      return player;
    });
    
    playersRef.current = newPlayers;
    setIsPlaying(true);
    Tone.Transport.start();
  };

  const pausePlayback = () => {
    Tone.Transport.pause();
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    stopAllPlayers();
  };

  const toggleLoop = (loopEnabled) => {
    setLoop(loopEnabled);
    Tone.Transport.loop = loopEnabled;
    if (loopEnabled) {
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = '1m';
    }
  };

  const addTrack = async (file) => {
    try {
      if (!file.type.match(/audio\/(mp3|wav|ogg|aac|mpeg)/)) {
        console.error('Unsupported file type:', file.type);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const buffer = await Tone.Buffer.fromUrl(objectUrl);
      URL.revokeObjectURL(objectUrl);

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
      
      setTracks(prev => [...prev, newTrack]);
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert(`Failed to load audio: ${error.message}`);
    }
  };

  const removeTrack = (id) => {
    setTracks(prev => prev.filter(track => track.id !== id));
    if (selectedTrack === id) setSelectedTrack(null);
  };

  const updateTrack = (id, updates) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const handleMasterEffectsUpdate = (effects) => {
    applyMasterEffects(effects);
  };

  const applyMasterEffects = (effects) => {
    if (!masterRef.current) return;
    
    const { eq, compressor, reverb } = masterRef.current.effects;
    
    effects.forEach(effect => {
      switch(effect.type) {
        case 'eq':
          eq.low.value = effect.active ? (effect.params.low || 0) : 0;
          eq.mid.value = effect.active ? (effect.params.mid || 0) : 0;
          eq.high.value = effect.active ? (effect.params.high || 0) : 0;
          break;
        case 'compressor':
          compressor.threshold.value = effect.active ? (effect.params.threshold || -24) : 0;
          compressor.ratio.value = effect.active ? (effect.params.ratio || 4) : 1;
          compressor.attack.value = effect.active ? (effect.params.attack || 0.003) : 0.003;
          compressor.release.value = effect.active ? (effect.params.release || 0.25) : 0.25;
          break;
        case 'reverb':
          reverb.wet.value = effect.active ? (effect.params.wet || 0.5) : 0;
          if (effect.active) {
            reverb.decay = effect.params.decay || 2.5;
            reverb.preDelay = effect.params.preDelay || 0.01;
          }
          break;
      }
    });
  };

  const exportToWav = async () => {
    try {
      const offlineCtx = new OfflineAudioContext(
        2,
        Tone.context.sampleRate * 10,
        Tone.context.sampleRate
      );
      
      const masterChannel = new Tone.Channel().connect(offlineCtx.destination);
      
      const players = tracks.map(track => {
        const player = new Tone.Player(track.buffer).connect(masterChannel);
        return player;
      });
      
      players.forEach(player => player.start());
      
      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'mixdown.wav';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export mix: ' + error.message);
    }
  };

  function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * numOfChan * 2, true);
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let chan = 0; chan < numOfChan; chan++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(chan)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([view], { type: 'audio/wav' });
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.match(/audio\/(mp3|wav|ogg|aac|mpeg)/)) {
        addTrack(file);
      }
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
        <button 
          className={styles.toolbarButton}
          onClick={exportToWav}
          disabled={tracks.length === 0}
        >
          <FiDownload /> Экспорт в WAV
        </button>
        <Transport 
          isPlaying={isPlaying}
          onPlay={playAllTracks}
          onPause={pausePlayback}
          onStop={stopPlayback}
          onToggleLoop={toggleLoop}
        />
      </div>

      <div className={styles.tracksContainer}>
        {tracks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Перетащите аудиофайлы сюда или нажмите "Добавить трек"</p>
          </div>
        ) : (
          tracks.map(track => (
            <Track
              key={track.id}
              track={track}
              isSelected={selectedTrack === track.id}
              onSelect={() => setSelectedTrack(track.id)}
              onUpdate={(updates) => updateTrack(track.id, updates)}
              onRemove={() => removeTrack(track.id)}
              masterRef={masterRef}
            />
          ))
        )}
      </div>

      <MasterChannel 
        masterRef={masterRef} 
        onMasterUpdate={handleMasterEffectsUpdate}
      />
    </div>
  );
}