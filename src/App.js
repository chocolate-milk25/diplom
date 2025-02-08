import React, { useState, useEffect, useRef } from "react";
import SequencerGrid from "./SequencerGrid";
import PianoKeys from "./PianoKeys";
import Controls from "./Controls";
import "./styles/App.css";

function App() {
  const [soundTrack, setSoundTrack] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [intervalId, setIntervalId] = useState(null);
  const sequencerRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [totalSteps, setTotalSteps] = useState(64);
  const [selectedNote, setSelectedNote] = useState(null);

  // Логика воспроизведения трека
  useEffect(() => {
    let id;
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;
      id = setInterval(() => {
        setCurrentStep((step) => {
          playStepNotes(step);
          return (step + 1) % totalSteps;
        });
      }, interval);
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, bpm, soundTrack, notes, totalSteps]);

  const playStepNotes = (step) => {
    const activeNotes = soundTrack.filter(
      (note) => note.start <= step && step < note.start + note.length
    );
    activeNotes.forEach((note) => {
      const noteData = notes.find((n) => n.name === note.name);
      if (noteData) playSound(noteData.file);
    });
  };

  const playSound = (file) => {
    const audio = new Audio(file);
    audio.play();
  };

  const stopAllSounds = () => {
    document.querySelectorAll("audio").forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch("/notes.json");
        if (!response.ok) throw new Error("Failed to load notes");
        const data = await response.json();
        setNotes(data);
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    };
    fetchNotes();
  }, []);

  return (
    <div className="App">
      <Controls
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        bpm={bpm}
        setBpm={setBpm}
        totalSteps={totalSteps}
        setTotalSteps={setTotalSteps}
        handleExport={() => handleExport(soundTrack)}
        handleImport={handleImport}
        handleReset={handleReset}
      />
      <div className="sequencer-wrapper">
        <div className="sequencer-content">
          <PianoKeys notes={notes} playSound={playSound} />
          <SequencerGrid
            soundTrack={soundTrack}
            setSoundTrack={setSoundTrack}
            notes={notes}
            totalSteps={totalSteps}
            currentStep={currentStep}
            toggleNote={toggleNote}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            handleResize={handleResize}
          />
        </div>
      </div>
    </div>
  );

  function toggleNote(start, noteName) {
    setSoundTrack((prevTrack) => {
      const existingNoteIndex = prevTrack.findIndex(
        (note) => note.name === noteName && note.start === start
      );
      if (existingNoteIndex !== -1) {
        if (!selectedNote || selectedNote.index !== existingNoteIndex) {
          setSelectedNote({ index: existingNoteIndex, note: prevTrack[existingNoteIndex] });
          return [...prevTrack];
        }
        const updatedTrack = [...prevTrack];
        updatedTrack.splice(existingNoteIndex, 1);
        return updatedTrack;
      } else {
        const newNote = { name: noteName, start, length: 1 };
        const updatedTrack = [...prevTrack, newNote];
        return updatedTrack;
      }
    });
  }

  function handleResize(newLength) {
    if (selectedNote) {
      setSoundTrack((prevTrack) => {
        const updatedTrack = [...prevTrack];
        updatedTrack[selectedNote.index] = {
          ...updatedTrack[selectedNote.index],
          length: Math.max(1, newLength),
        };
        return updatedTrack;
      });
    }
  }

  function handleExport(track) {
    const dataStr = JSON.stringify(track, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "sequencer-track.json";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        if (Array.isArray(content)) {
          setSoundTrack(content);
        } else {
          alert("Invalid file format.");
        }
      } catch (error) {
        console.error("Error parsing the file:", error);
        alert("Error reading the file.");
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    setIsPlaying(false);
    setCurrentStep(0);
    setSoundTrack([]);
    setTotalSteps(64);
    setSelectedNote(null);
    stopAllSounds();
  }
}

export default App;