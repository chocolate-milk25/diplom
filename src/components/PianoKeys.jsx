import React, { useState, useEffect } from "react";
import { playSound, fetchNotes } from "../utils/soundUtils.js"; // Импортируем playSound и fetchNotes
import "../styles/App.css"; // Стили

const PianoKeys = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes(setNotes); // Загружаем ноты при монтировании
  }, []);

  return (
    <div className="piano-keys-container">
      {notes.map((note, index) => (
        <button
          key={index}
          className={`key-button ${note.type === "white" ? "white-key" : "black-key"}`}
          onClick={() => playSound(note.file)}
        >
          {note.name.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default PianoKeys;
