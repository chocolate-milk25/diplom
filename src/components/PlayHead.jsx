import React, { useEffect, useRef } from "react";

function PlayHead({ currentStep, totalSteps, sequencerRef }) {
    const playheadRef = useRef(null);
    window.sr = sequencerRef.current;

    useEffect(() => {
        const sequencerGrid = sequencerRef.current;
        if (!sequencerGrid) return;
        const sequncerGridRect = sequencerGrid.getBoundingClientRect();
        console.log(currentStep);

        // const cell = sequencerGrid.querySelector(".cell");
        // if (!cell) return;

        const rows = sequencerGrid.getElementsByClassName("note-row"); 
        console.log(rows);
        const row = rows[currentStep];
        if (!row) return;
        const rowRect = row.getBoundingClientRect();

        // const cellWidth = cell.offsetWidth; 
        // const gap = parseInt(window.getComputedStyle(sequencerGrid).getPropertyValue("gap")) || 0;
        // const stepWidth = cellWidth + gap; // Учитываем gap между ячейками

        const playhead = playheadRef.current;
        if (playhead) {
            playhead.style.left = `${rowRect.left - sequncerGridRect.left}px`;
            console.log(currentStep, rowRect.left, playhead.style.left);
        }
    }, [currentStep, totalSteps, sequencerRef]);

    return <div ref={playheadRef} className="playhead"></div>;
}

export default PlayHead;
