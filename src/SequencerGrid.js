import React, { useEffect, useRef } from "react";
import "./styles/App.css";

function SequencerGrid({
  soundTrack,
  setSoundTrack,
  notes,
  totalSteps,
  currentStep,
  toggleNote,
  selectedNote,
  setSelectedNote,
  handleResize,
}) {
  const sequencerRef = useRef(null);

  useEffect(() => {
    const sequencerWrapper = document.querySelector(".sequencer-wrapper");
    const sequencerGrid = sequencerRef.current;
    if (!sequencerGrid || !sequencerWrapper) return;

    const playhead = document.createElement("div");
    playhead.className = "playhead";
    sequencerGrid.appendChild(playhead);

    const updatePlayheadPosition = () => {
      const cellWidth = sequencerGrid.querySelector(".cell")?.offsetWidth || 20;
      const gap = parseInt(window.getComputedStyle(sequencerGrid)?.gap || "0", 10);
      const effectiveCellWidth = cellWidth + gap;
      const newLeft =
        currentStep * effectiveCellWidth -
        sequencerGrid.scrollLeft +
        120; // Ширина контейнера клавиш
      playhead.style.transform = `translateX(${newLeft}px)`;
    };

    updatePlayheadPosition();

    const handleScroll = () => updatePlayheadPosition();
    sequencerGrid.addEventListener("scroll", handleScroll);

    return () => {
      if (playhead && playhead.parentNode) {
        playhead.parentNode.removeChild(playhead);
      }
      if (sequencerGrid) {
        sequencerGrid.removeEventListener("scroll", handleScroll);
      }
    };
  }, [currentStep, totalSteps]);

  return (
    <div className="sequencer-grid" ref={sequencerRef}>
      {notes.map((note, noteIndex) => (
        <div key={noteIndex} className="note-row">
          {Array.from({ length: totalSteps }).map((_, step) => {
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
                key={step}
                className={`cell ${isActive ? "active" : ""}`}
                onClick={() => toggleNote(step, note.name)}
                onMouseDown={(e) => handleResizeStart(e, step, note.name)}
              >
                {isEndOfNote && selectedNote && selectedNote.note.name === note.name && (
                  <div
                    className="resize-handle"
                    onMouseMove={(e) => handleResize(e, step)}
                    onMouseUp={() => setSelectedNote(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  function handleResizeStart(e, step, noteName) {
    e.preventDefault();
    const note = soundTrack.find((n) => n.name === noteName && n.start + n.length - 1 === step);
    if (note) {
      setSelectedNote({ index: soundTrack.indexOf(note), note });
      const onMouseMove = (moveEvent) => {
        const newLength = Math.max(1, moveEvent.clientX - e.clientX + note.length);
        handleResize(newLength, step);
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setSelectedNote(null);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  }

  function handleResize(newLength, step) {
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
}

export default SequencerGrid;