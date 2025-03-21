import React, { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import Controls from "./components/Controls";
import PianoKeys from "./components/PianoKeys";
import SequencerGrid from "./components/SequencerGrid";
import NumberControl from "./components/NumberControl";
import { playSound, handleReset, fetchNotes } from './utils/soundUtils';
import { handleExport, handleImport } from './utils/fileUtils';

function App() {
  const [soundTrack, setSoundTrack] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [notes, setNotes] = useState([]);
  const [totalSteps, setTotalSteps] = useState(64);

  const pianoRef = useRef(null); // Ссылка на контейнер с клавишами
  const sequencerRef = useRef(null); // Ссылка на контейнер с сеткой

  const toggleNote = (step, noteName) => {
    setSoundTrack((prevTrack) => {
      const updatedTrack = [...prevTrack];
      const existingNoteIndex = updatedTrack.findIndex(
        (n) => n.name === noteName && n.start <= step && step < n.start + n.length
      );

      if (existingNoteIndex === -1) {
        updatedTrack.push({
          name: noteName,
          start: step,
          length: 1,
        });
      } else {
        updatedTrack.splice(existingNoteIndex, 1);
      }

      return updatedTrack;
    });
  };

  const playStepNotes = (step) => {
    const activeNotes = soundTrack.filter(
      (note) => note.start <= step && step < note.start + note.length
    );
    activeNotes.forEach((note) => {
      const noteData = notes.find((n) => n.name === note.name);
      if (noteData) playSound(noteData.file);
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

  // Синхронизация прокрутки
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
            <PianoKeys notes={notes} playSound={playSound} />
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
      <input id="import-file" type="file" style={{ display: "none" }} onChange={handleImport(setSoundTrack, setBpm, setTotalSteps)} />
    </div>
  );
}

export default App;
