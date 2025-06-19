import { useState, useRef } from 'react';
import EnhancedSequencer from './Sequencer/EnhancedSequencer.jsx';
import Synth from './Synth/Synth.jsx';
import DrumMachine from './DrumMachine/DrumMachine.jsx';
import Mixer from './Mixer/Mixer.jsx';
import * as Tone from 'tone';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('mixer');
  const playNoteRef = useRef(() => {});
  const stopNoteRef = useRef(() => {});
  const recorder = useRef(null);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [audioStarted, setAudioStarted] = useState(false);
  const [synthSettings, setSynthSettings] = useState(null);

  const settings = {
    bpm: 120,
    swing: 0,
    masterVolume,
    synthSettings
  };

  const initAudio = async () => {
    if (!audioStarted) {
      await Tone.start();
      console.log('Audio is ready');
      setAudioStarted(true);
    }
  };

  const handleTabClick = (tab) => {
    initAudio();
    setActiveTab(tab);
  };

  const updateSynthSettings = (settings) => {
    setSynthSettings(settings);
  };

  return (
    <div className="vst-container">
      <header className="vst-header">
        <h1 className="app-title">БЭНДЛАБ УБИЙЦА</h1>

        {!audioStarted && (
          <div className="audio-start-notice">
            Нажмите любую кнопку для активации аудио
          </div>
        )}

        <div className="tab-buttons">
          <button className={activeTab === 'mixer' ? 'active' : ''} onClick={() => handleTabClick('mixer')}>🎚️ Микшер</button>
          <button className={activeTab === 'sequencer' ? 'active' : ''} onClick={() => handleTabClick('sequencer')}>🎹 Секвенсор</button>
          
          <button className={activeTab === 'drums' ? 'active' : ''} onClick={() => handleTabClick('drums')}>🥁 Драм-машина</button>
        </div>

        <div className="master-controls">
          <label className="master-volume">
            Громкость:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            />
            <span>{Math.round(masterVolume * 100)}%</span>
          </label>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'mixer' && <Mixer masterVolume={masterVolume} />}

        {activeTab === 'sequencer' && (
          <div className="sequencer-page">
            <EnhancedSequencer
              synthPlayNote={(freq) => {
                if (audioStarted) playNoteRef.current(freq);
              }}
              settings={settings}
              synthSettings={synthSettings}
              recorder={recorder}
            />
            <Synth
              refPlayNote={playNoteRef}
              refStopNote={stopNoteRef}
              settings={settings}
              audioStarted={audioStarted}
              onSettingsChange={updateSynthSettings}
              recorder={recorder}
            />
          </div>
        )}

        {activeTab === 'synth' && (
          <Synth
            refPlayNote={playNoteRef}
            refStopNote={stopNoteRef}
            settings={settings}
            audioStarted={audioStarted}
            onSettingsChange={updateSynthSettings}
            recorder={recorder}
          />
        )}

        {activeTab === 'drums' && (
          <DrumMachine
            settings={settings}
            audioStarted={audioStarted}
          />
        )}
      </main>
    </div>
  );
}