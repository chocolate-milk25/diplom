// DrumMachine.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { FaPlay, FaPause, FaStop, FaPlus, FaTrash, FaVolumeMute, FaVolumeUp, FaHeadphones, FaSave, FaUpload, FaDownload } from 'react-icons/fa';
import styles from './DrumMachine.module.css';

const SAMPLES = {
  kick: [
    { name: "808 Kick", url: "/samples/808 Kick.mp3" },
    { name: "Acoustic Kick", url: "/samples/Acoustic Kick.mp3" }
  ],
  snare: [
    { name: "808 Snare", url: "/samples/808 Snare.mp3" },
    { name: "Acoustic Snare", url: "/samples/Acoustic Snare.mp3" }
  ],
  hihat: [
    { name: "Closed Hat", url: "/samples/Closed Hat.mp3" },
    { name: "Open Hat", url: "/samples/Open Hat.mp3" }
  ]
};

const INITIAL_PATTERN = {
  name: "Default Pattern",
  bpm: 120,
  swing: 0,
  tracks: [
    {
      id: "kick",
      name: "Kick",
      type: "kick",
      sample: SAMPLES.kick[0],
      steps: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      volume: 0.8,
      mute: false,
      solo: false
    },
    {
      id: "snare",
      name: "Snare",
      type: "snare",
      sample: SAMPLES.snare[0],
      steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      volume: 0.7,
      mute: false,
      solo: false
    },
    {
      id: "hihat",
      name: "HiHat",
      type: "hihat",
      sample: SAMPLES.hihat[0],
      steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      volume: 0.6,
      mute: false,
      solo: false
    }
  ]
};

export default function DrumMachine() {
  const [pattern, setPattern] = useState(INITIAL_PATTERN);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showSampleBrowser, setShowSampleBrowser] = useState(false);
  const players = useRef({});
  const transport = useRef(null);
  const isInitialized = useRef(false);

  // Инициализация аудио
  const initAudio = async () => {
    await Tone.start();
    console.log('Audio is ready');
  };

  // Инициализация плееров
  const initPlayers = async () => {
    for (const track of pattern.tracks) {
      if (!players.current[track.id]) {
        try {
          const player = new Tone.Player({
            url: track.sample.url,
            onload: () => console.log(`${track.name} loaded`),
            onerror: (e) => console.error(`Error loading ${track.name}:`, e),
          }).toDestination();
          
          await player.load(track.sample.url);
          player.volume.value = Tone.gainToDb(track.volume);
          players.current[track.id] = player;
        } catch (error) {
          console.error(`Failed to load sample for ${track.name}:`, error);
        }
      }
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    initAudio();
    initPlayers();

    return () => {
      Object.values(players.current).forEach(player => player.dispose());
      if (transport.current) {
        transport.current.dispose();
      }
    };
  }, []);

  // Обновление при изменении треков
  useEffect(() => {
    initPlayers();
    setupTransport();
  }, [pattern.tracks]);

  const setupTransport = () => {
  if (transport.current) {
    transport.current.dispose();
  }

  const stepsCount = pattern.tracks[0]?.steps.length || 16;

  transport.current = new Tone.Part((time, value) => {
    const { step } = value;
    setCurrentStep(step);

    const activeTracks = pattern.tracks.filter(track => {
      // Если включён solo — играют только solo-дорожки
      if (pattern.tracks.some(t => t.solo)) {
        return track.solo;
      }
      return !track.mute;
    });

    for (const track of activeTracks) {
      const stepActive = track.steps[step];
      const player = players.current[track.id];
      if (stepActive && player) {
        player.start(time);
      }
    }
  }, Array.from({ length: stepsCount }, (_, i) => ({ time: `${i * 0.25}`, step: i })));

  transport.current.loop = true;
  transport.current.loopEnd = `${stepsCount * 0.25}m`;

  Tone.Transport.bpm.value = pattern.bpm;
  Tone.Transport.swing = pattern.swing;
  transport.current.start(0);
};

  const play = async () => {
  await Tone.start();

  if (!isPlaying) {
    setupTransport();
    Tone.Transport.start();
    setIsPlaying(true);
  } else {
    Tone.Transport.pause();
    setIsPlaying(false);
  }
};

  const stop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  // Функции импорта/экспорта
  const exportPattern = () => {
    const dataStr = JSON.stringify(pattern);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `drum_pattern_${new Date().toISOString()}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', exportName);
    link.click();
  };

  const importPattern = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setPattern(imported);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Invalid pattern file');
      }
    };
    reader.readAsText(file);
  };

  const exportWAV = async () => {
    await Tone.start();
    const recorder = new Tone.Recorder();
    Tone.Destination.connect(recorder);
    
    // Записываем 8 тактов
    const duration = (60 / pattern.bpm) * 4 * 2; 
    recorder.start();
    
    // Воспроизводим паттерн
    setupTransport();
    Tone.Transport.start();
    
    // Ждем окончания записи
    setTimeout(async () => {
      Tone.Transport.stop();
      const recording = await recorder.stop();
      const url = URL.createObjectURL(recording);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `drum_beat_${new Date().toISOString()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, duration * 1000);
  };

  const toggleStep = (trackId, stepIndex) => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId 
          ? { 
              ...track, 
              steps: track.steps.map((step, i) => 
                i === stepIndex ? (step ? 0 : 1) : step
              )
            } 
          : track
      )
    }));
  };

  const addTrack = async () => {
    const newTrack = {
      id: `track_${Date.now()}`,
      name: "New Track",
      type: "kick",
      sample: SAMPLES.kick[0],
      steps: new Array(16).fill(0),
      volume: 0.7,
      mute: false,
      solo: false
    };

    // Создаем и загружаем плеер для нового трека
    const player = new Tone.Player({
      url: newTrack.sample.url,
      onload: () => console.log(`${newTrack.name} loaded`),
      onerror: (e) => console.error(`Error loading ${newTrack.name}:`, e),
    }).toDestination();

    await player.load(newTrack.sample.url);
    players.current[newTrack.id] = player;

    setPattern(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));

    setSelectedTrack(newTrack.id);
    setShowSampleBrowser(true);
  };

  const removeTrack = (trackId) => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId)
    }));
    
    if (players.current[trackId]) {
      players.current[trackId].dispose();
      delete players.current[trackId];
    }
    
    if (selectedTrack === trackId) {
      setSelectedTrack(null);
    }
  };

  const updateTrackParam = async (trackId, param, value) => {
    // Особый случай для изменения семпла
    if (param === 'sample') {
      if (players.current[trackId]) {
        players.current[trackId].dispose();
      }
      
      const player = new Tone.Player({
        url: value.url,
        onload: () => console.log(`Sample changed for ${trackId}`),
      }).toDestination();
      
      await player.load(value.url);
      players.current[trackId] = player;
    }

    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId 
          ? { ...track, [param]: value }
          : track
      )
    }));

    if (param === 'volume' && players.current[trackId]) {
      players.current[trackId].volume.value = Tone.gainToDb(value);
    }
  };

  const updatePatternParam = (param, value) => {
    setPattern(prev => ({ ...prev, [param]: value }));
    if (param === 'bpm') {
      Tone.Transport.bpm.value = value;
    }
  };

  const playSample = async (sample) => {
    try {
      await Tone.start();
      const previewPlayer = new Tone.Player(sample.url).toDestination();
      await previewPlayer.load(sample.url);
      previewPlayer.start();
      setTimeout(() => previewPlayer.dispose(), 1000);
    } catch (error) {
      console.error("Ошибка при воспроизведении семпла:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>ДРАМ МАШИНА</h2>
        
        <div className={styles.transportControls}>
          <button onClick={play} className={`${styles.controlButton} ${isPlaying ? styles.active : ''}`}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={stop} className={styles.controlButton}>
            <FaStop />
          </button>
          
          <div className={styles.exportControls}>
            <button onClick={exportPattern} className={styles.controlButton} title="Export Pattern">
              <FaSave />
            </button>
            
            
          </div>
          <div className={styles.exportControls}>
            <label className={styles.controlButton} title="Import Pattern">
              <FaUpload />
              <input type="file" accept=".json" onChange={importPattern} style={{ display: 'none' }} />
            </label>
          </div>
          <div className={styles.exportControls}>
            <button onClick={exportWAV} className={styles.controlButton} title="Export WAV">
              <FaDownload />
            </button>
          </div>
        </div>
        <div className={styles.transportControls}>
          <button 
            onClick={play} 
            className={`${styles.controlButton} ${isPlaying ? styles.active : ''}`}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button 
            onClick={stop}
            className={styles.controlButton}
          >
            <FaStop />
          </button>
          
          <div className={styles.bpmControl}>
            <label>BPM:</label>
            <input
              type="number"
              min="40"
              max="300"
              value={pattern.bpm}
              onChange={e => updatePatternParam('bpm', +e.target.value)}
            />
          </div>
          
          <div className={styles.swingControl}>
            <label>Swing:</label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={pattern.swing}
              onChange={e => updatePatternParam('swing', +e.target.value)}
            />
            <span>{Math.round(pattern.swing * 100)}%</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.tracksPanel}>
          <div className={styles.panelHeader}>
            <h3>TRACKS</h3>
            <button 
              onClick={addTrack} 
              className={styles.addButton}
            >
              <FaPlus />
            </button>
          </div>
          
          <div className={styles.tracksList}>
            {pattern.tracks.map(track => (
              <div 
                key={track.id}
                className={`${styles.trackItem} ${selectedTrack === track.id ? styles.selected : ''}`}
                onClick={() => setSelectedTrack(track.id)}
              >
                <div className={styles.trackInfo}>
                  <span className={styles.trackName}>{track.name}</span>
                  <span className={styles.sampleName}>{track.sample.name}</span>
                </div>
                
                <div className={styles.trackControls}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={e => updateTrackParam(track.id, 'volume', +e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                  
                  <button
                    className={`${styles.muteButton} ${track.mute ? styles.active : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      updateTrackParam(track.id, 'mute', !track.mute);
                    }}
                  >
                    {track.mute ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                  
                  <button
                    className={styles.removeButton}
                    onClick={e => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.sequencerGrid}>
          <div className={styles.stepNumbers}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={styles.stepNumber}>
                {i % 4 === 0 ? i + 1 : ''}
              </div>
            ))}
          </div>
          
          {pattern.tracks.map(track => (
            <div key={track.id} className={styles.trackRow}>
              <div className={styles.trackLabel}>{track.name}</div>
              
              {track.steps.map((step, i) => (
                <div
                  key={i}
                  className={`${styles.stepCell} 
                    ${step ? styles.active : ''} 
                    ${currentStep === i ? styles.current : ''}`}
                  onClick={() => toggleStep(track.id, i)}
                >
                  {step && (
                    <div 
                      className={styles.stepIndicator}
                      style={{ height: `${track.volume * 100}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showSampleBrowser && (
        <div className={styles.sampleBrowserOverlay}>
          <div className={styles.sampleBrowser}>
            <div className={styles.browserHeader}>
              <h3>SELECT SAMPLE</h3>
              <button 
                onClick={() => setShowSampleBrowser(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.sampleCategories}>
              {Object.entries(SAMPLES).map(([type, samples]) => (
                <div key={type} className={styles.category}>
                  <h4>{type.toUpperCase()}</h4>
                  <div className={styles.samplesGrid}>
                    {samples.map((sample, i) => (
                      <div
                        key={i}
                        className={styles.sampleItem}
                        onClick={() => {
                          updateTrackParam(selectedTrack, 'sample', sample);
                          setShowSampleBrowser(false);
                        }}
                      >
                        <div className={styles.sampleName}>{sample.name}</div>
                        <button
                          className={styles.previewButton}
                          onClick={e => {
                            e.stopPropagation();
                            playSample(sample);
                          }}
                        >
                          <FaHeadphones />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}