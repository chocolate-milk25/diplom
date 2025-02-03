import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [soundTrack, setSoundTrack] = useState([]); // Трек с нотами
  const [isPlaying, setIsPlaying] = useState(false); // Воспроизводится ли трек
  const [currentStep, setCurrentStep] = useState(0); // Текущий шаг воспроизведения
  const [bpm, setBpm] = useState(120); // BPM (удары в минуту)
  const [intervalId, setIntervalId] = useState(null); // ID интервала для таймера
  const sequencerRef = useRef(null); // Реф для контейнера сетки
  const [notes, setNotes] = useState([]); // Список доступных нот
  const [activeSteps, setActiveSteps] = useState({ min: 0, max: 0 }); // Диапазон активных шагов
  const [selectedNote, setSelectedNote] = useState(null); // Выбранная нота для изменения длины
  const audioPlayers = {}; // Хранилище для аудио элементов

  // Функция для воспроизведения звука
  const playSound = (file) => {
    const audio = new Audio(file);
    audioPlayers[file] = audio;
    audio.addEventListener("error", (err) =>
      console.error(`Не удалось загрузить файл ${file}:`, err)
    );
    audio.play();
  };

  // Функция для остановки всех звуков
  const stopAllSounds = () => {
    Object.values(audioPlayers).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  // Эффект для управления воспроизведением
  useEffect(() => {
    let id;
    if (isPlaying) {
      const interval = (60 / bpm) * 1000; // Вычисляем интервал на основе BPM
      id = setInterval(() => {
        setCurrentStep((prevStep) => {
          const nextStep =
            prevStep < activeSteps.max
              ? (prevStep + 1) % (activeSteps.max + 1)
              : 0;
          const activeNotes = soundTrack.filter(
            (note) => note.start <= prevStep && prevStep < note.start + note.length
          );
          activeNotes.forEach((note) => {
            const noteData = notes.find((n) => n.name === note.name);
            if (noteData) playSound(noteData.file);
          });
          return nextStep;
        });
      }, interval);
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
      stopAllSounds();
    };
  }, [isPlaying, bpm, soundTrack, notes, activeSteps]);

  // Обработчики кнопок управления
  const handlePlay = () => setIsPlaying(true);
  const handleStop = () => {
    setIsPlaying(false);
    stopAllSounds();
  };
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSoundTrack([]);
    setActiveSteps({ min: 0, max: 0 });
    setSelectedNote(null);
    stopAllSounds();
  };

  // Добавление/удаление ноты
  const toggleNote = (start, noteName) => {
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
        updateActiveSteps(updatedTrack);
        setSelectedNote(null);
        return updatedTrack;
      } else {
        const newNote = { name: noteName, start, length: 1 };
        const updatedTrack = [...prevTrack, newNote];
        updateActiveSteps(updatedTrack);
        return updatedTrack;
      }
    });
  };

  // Изменение длины ноты
  const handleResize = (newLength) => {
    if (selectedNote) {
      setSoundTrack((prevTrack) => {
        const updatedTrack = [...prevTrack];
        updatedTrack[selectedNote.index] = {
          ...updatedTrack[selectedNote.index],
          length: Math.max(1, newLength),
        };
        updateActiveSteps(updatedTrack);
        return updatedTrack;
      });
    }
  };

  // Начало изменения длины
  const handleResizeStart = (e, step) => {
    e.preventDefault();
    const note = soundTrack.find((n) => n.start + n.length - 1 === step);
    if (note) {
      setSelectedNote({ index: soundTrack.indexOf(note), note });
      const onMouseMove = (moveEvent) => {
        const newLength = Math.max(1, moveEvent.clientX - e.clientX + note.length);
        handleResize(newLength);
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setSelectedNote(null);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  };

  // Обновление диапазона активных шагов
  const updateActiveSteps = (track) => {
    if (track.length === 0) {
      setActiveSteps({ min: 0, max: 0 });
      return;
    }
    const minStep = Math.min(...track.map((note) => note.start));
    const maxStep = Math.max(...track.map((note) => note.start + note.length - 1));
    setActiveSteps({ min: minStep, max: maxStep });
  };

  // Загрузка данных о нотах из JSON
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
      <header className="App-header">
        {/* Панель управления */}
        <div className="controls-container">
          <h1>Sequencer</h1>
          <div className="controls">
            <button onClick={handlePlay} disabled={isPlaying}>
              Play
            </button>
            <button onClick={handleStop} disabled={!isPlaying}>
              Stop
            </button>
            <button onClick={handleReset}>Reset</button>
          </div>
          <label className="bpm-control">
            BPM:
            <input
              type="range"
              min="60"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
            />
            {bpm}
          </label>
        </div>
        {/* Контент: кнопки нот и сетка */}
        <div className="content-container">
          {/* Кнопки нот */}
          <div className="keys-container">
            {notes.map((note, index) => (
              <button
                key={note.name}
                className="key-button"
                onClick={() => playSound(note.file)}
              >
                {note.name}
              </button>
            ))}
          </div>
          {/* Сетка секвенсера */}
          <div className="sequencer-grid" ref={sequencerRef}>
            {notes.map((note, noteIndex) => (
              <>
                {Array.from({ length: 64 }).map((_, step) => {
                  const isActive = soundTrack.some(
                    (n) =>
                      n.name === note.name &&
                      n.start <= step &&
                      step < n.start + n.length
                  );
                  const isEndOfNote =
                    soundTrack.find(
                      (n) => n.name === note.name && n.start + n.length - 1 === step
                    ) !== undefined;

                  return (
                    <div
                      key={`${note.name}-${step}`}
                      className={`cell ${isActive ? "active" : ""}`}
                      onClick={() => toggleNote(step, note.name)}
                      style={{
                        transition: "background-color 0.2s",
                        backgroundColor: isActive ? "lightblue" : "transparent",
                      }}
                    >
                      {isEndOfNote && selectedNote && selectedNote.note.name === note.name && (
                        <div
                          className="resize-handle"
                          onMouseDown={(e) => handleResizeStart(e, step)}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;