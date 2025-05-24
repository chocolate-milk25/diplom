import React, { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import Controls from "./components/Controls";
import PianoKeys from "./components/PianoKeys";
import SequencerGrid from "./components/SequencerGrid";
import NumberControl from "./components/NumberControl";
import Equalizer from "./components/Equalizer";
import Compressor from "./components/Compressor.jsx";
import Visualizer from "./components/Visualizer";
import { handleReset, fetchNotes } from './utils/soundUtils';
import { handleExport, handleImport } from './utils/fileUtils';

function App() {
  const [soundTrack, setSoundTrack] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [notes, setNotes] = useState([]);
  const [totalSteps, setTotalSteps] = useState(64);

  const compressorRef = useRef(null);
  const [compressorReady, setCompressorReady] = useState(false);

  const pianoRef = useRef(null);
  const sequencerRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const filtersRef = useRef({ low: null, mid: null, high: null });

  useEffect(() => {
    if (!audioContextRef.current) {
      const context = new AudioContext();
      audioContextRef.current = context;

      const low = context.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 320;

      const mid = context.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 1;

      const high = context.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 3200;

      const compressor = context.createDynamicsCompressor();

      // Подключаем фильтры друг к другу
      low.connect(mid);
      mid.connect(high);
      high.connect(compressor);

      const masterAnalyser = context.createAnalyser();
      masterAnalyser.fftSize = 256;

      compressor.connect(masterAnalyser);
      masterAnalyser.connect(context.destination);

      filtersRef.current = { low, mid, high };
      compressorRef.current = compressor;
      analyserRef.current = masterAnalyser;

      setCompressorReady(true);
    }
  }, []);

  const toggleNote = (step, noteName) => {
    setSoundTrack(prevTrack => {
      const updated = [...prevTrack];
      const index = updated.findIndex(
        (n) => n.name === noteName && step >= n.start && step < n.start + n.length
      );
      if (index === -1) {
        updated.push({ name: noteName, start: step, length: 1 });
      } else {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const playNoteWithAnalyser = async (filePath) => {
  if (!audioContextRef.current || !analyserRef.current) return;

  const context = audioContextRef.current;
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();

  // decodeAudioData в AudioContext с промисом (новый стандарт)
  const buffer = await context.decodeAudioData(arrayBuffer);

  const source = context.createBufferSource();
  source.buffer = buffer;

  const { low } = filtersRef.current;
  source.connect(low);
  source.start(0);
};

  const playStepNotes = (step) => {
    const activeNotes = soundTrack.filter(
      (n) => step >= n.start && step < n.start + n.length
    );
    activeNotes.forEach(({ name }) => {
      const noteData = notes.find(n => n.name === name);
      if (noteData) playNoteWithAnalyser(noteData.file);
    });
  };

  useEffect(() => {
    fetchNotes(setNotes);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = (60 / bpm) * 1000;
    const id = setInterval(() => {
      setCurrentStep(step => {
        playStepNotes(step);
        return (step + 1) % totalSteps;
      });
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, bpm, totalSteps]);

  const syncScroll = () => {
    if (pianoRef.current && sequencerRef.current) {
      sequencerRef.current.scrollTop = pianoRef.current.scrollTop;
    }
  };

  return (
    <div className="App">
      <Visualizer analyser={analyserRef.current} />
      <Controls
        buttons={[
          { label: "Play", action: () => setIsPlaying(true), disabled: isPlaying },
          { label: "Stop", action: () => setIsPlaying(false), disabled: !isPlaying },
          { label: "Reset", action: () => handleReset(setIsPlaying, setCurrentStep, setSoundTrack, setTotalSteps), disabled: false },
          { label: "Export", action: () => handleExport(soundTrack, bpm, totalSteps), disabled: false },
          { label: "Import", action: () => document.getElementById("import-file").click(), disabled: false },
        ]}
      />
      <div className="sequencer-wrapper" onScroll={syncScroll}>
        <div className="sequencer-content">
          <div ref={pianoRef} className="piano-keys-container">
            <PianoKeys notes={notes} playSound={playNoteWithAnalyser} />
          </div>
          <div ref={sequencerRef} className="sequencer-grid">
            <SequencerGrid
              soundTrack={soundTrack}
              setSoundTrack={setSoundTrack}
              notes={notes}
              totalSteps={totalSteps}
              currentStep={currentStep}
              toggleNote={toggleNote}
            />
          </div>
        </div>
      </div>
      <div className="controls">
        <NumberControl label="BPM" value={bpm} onChange={setBpm} min={60} max={240} />
        <NumberControl label="Steps" value={totalSteps} onChange={setTotalSteps} min={1} max={256} />
      </div>
      <input id="import-file" type="file" style={{ display: "none" }} onChange={handleImport(setTotalSteps, setBpm, setSoundTrack)} />
      <Equalizer
        analyser={analyserRef.current}
        filters={[filtersRef.current.low, filtersRef.current.mid, filtersRef.current.high]}
      />
      {compressorReady && <Compressor compressor={compressorRef.current} />}
    </div>
  );
}

export default App;
