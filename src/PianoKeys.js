import React from "react";
import "./styles/App.css";

function PianoKeys({ notes, playSound }) {
  return (
    <div className="piano-keys-container">
      {notes.map((note, index) => (
        <button
          key={index}
          className={`key-button ${note.color}`}
          onClick={() => playSound(note.file)}
        >
          {note.name}
        </button>
      ))}
    </div>
  );
}

export default PianoKeys;