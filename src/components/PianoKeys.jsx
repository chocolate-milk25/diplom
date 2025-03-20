import React from "react";

function PianoKeys({ notes }) {
  return (
    <div className="piano-keys-container">
      {notes.map((note, index) => (
        <button key={index} className={`key-button ${note.color}`}>
          {note.name}
        </button>
      ))}
    </div>
  );
}

export default PianoKeys;
