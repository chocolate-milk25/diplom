import React, { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import Controls from "./components/Controls";
import PianoKeys from "./components/PianoKeys";
import SequencerGrid from "./components/SequencerGrid";
import NumberControl from "./components/NumberControl";
import Equalizer from "./components/Equalizer";
import { handleReset, fetchNotes } from './utils/soundUtils';
import { handleExport, handleImport } from './utils/fileUtils';

function App() {
  const [soundTrack, setSoundTrack] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [notes, setNotes] = useState([]);
  const [totalSteps, setTotalSteps] = useState(64);

  const pianoRef = useRef(null);
  const sequencerRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const filtersRef = useRef({ low: null, mid: null, high: null });

  useEffect(() => {
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

    filtersRef.current = { low, mid, high };

    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    high.connect(analyser);
    analyser.connect(context.destination);
    analyserRef.current = analyser;
  }, []);

  const toggleNote = (step, noteName) => {
    setSoundTrack((prevTrack) => {
      const updatedTrack = [...prevTrack];
      const existingNoteIndex = updatedTrack.findIndex(
        (n) => n.name === noteName && n.start <= step && step < n.start + n.length
      );
      if (existingNoteIndex === -1) {
        updatedTrack.push({ name: noteName, start: step, length: 1 });
      } else {
        updatedTrack.splice(existingNoteIndex, 1);
      }
      return updatedTrack;
    });
  };

  const playNoteWithAnalyser = async (filePath) => {
    if (!audioContextRef.current || !analyserRef.current) return;
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;

    const { low, mid, high } = filtersRef.current;
    source.connect(low);
    low.connect(mid);
    mid.connect(high);

    source.start(0);
  };

  const playStepNotes = (step) => {
    const activeNotes = soundTrack.filter(
      (note) => note.start <= step && step < note.start + note.length
    );
    activeNotes.forEach((note) => {
      const noteData = notes.find((n) => n.name === note.name);
      if (noteData) playNoteWithAnalyser(noteData.file);
    });
  };

  useEffect(() => {
    fetchNotes(setNotes);
  }, []);

  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;
      intervalId = setInterval(() => {
        setCurrentStep((prevStep) => {
          playStepNotes(prevStep);
          return (prevStep + 1) % totalSteps;
        });
      }, interval);
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, bpm, totalSteps]);

  const syncScroll = () => {
    const pianoScroll = pianoRef.current.scrollTop;
    const sequencerScroll = sequencerRef.current.scrollTop;
    if (pianoScroll !== sequencerScroll) {
      sequencerRef.current.scrollTop = pianoScroll;
    }
  };

  return (
    <div className="App">
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
    </div>
  );
}

export default App;