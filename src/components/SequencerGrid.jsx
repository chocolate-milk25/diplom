import React from "react";

function SequencerGrid({
  soundTrack,
  setSoundTrack,
  notes,
  totalSteps,
  currentStep,
  toggleNote,
}) {
  return (
    <div className="sequencer-grid">
      {notes.map((note, noteIndex) => (
        <div key={noteIndex} className="note-row">
          {Array.from({ length: totalSteps }).map((_, step) => {
            const isActive = soundTrack.some(
              (n) =>
                n.name === note.name &&
                n.start <= step &&
                step < n.start + n.length
            );

            return (
              <div
                key={step}
                className={`cell ${isActive ? "active" : ""}`}
                onClick={() => toggleNote(step, note.name)}
              ></div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default SequencerGrid;
