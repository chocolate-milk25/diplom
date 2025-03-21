import React, { useEffect, useRef } from "react";
import PlayHead from "./PlayHead"; // Импортируем компонент

function SequencerGrid({ soundTrack, setSoundTrack, notes, totalSteps, currentStep, toggleNote }) {
    const sequencerRef = useRef(null); // Создаем ref для сетки

    return (
        <div className="sequencer-grid" ref={sequencerRef}>
            {/* PlayHead теперь внутри сетки */}
            <PlayHead currentStep={currentStep} totalSteps={totalSteps} sequencerRef={sequencerRef} />
            {notes.map((note, noteIndex) => (
                <div key={noteIndex} className="note-row">
                    {Array.from({ length: totalSteps }).map((_, step) => {
                        const isActive = soundTrack.some(
                            (n) => n.name === note.name && n.start <= step && step < n.start + n.length
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
