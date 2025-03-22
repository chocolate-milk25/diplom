import React, { useEffect, useRef } from "react";

function PlayHead({ currentStep, totalSteps, sequencerRef }) {
    const playheadRef = useRef(null);

    useEffect(() => {
        const sequencerGrid = sequencerRef.current;
        if (!sequencerGrid) return;

        const cell = sequencerGrid.querySelector(".cell");
        if (!cell) return;

        const cellWidth = cell.offsetWidth; 
        const gap = parseInt(window.getComputedStyle(sequencerGrid).getPropertyValue("gap")) || 0;
        const stepWidth = cellWidth + gap; // Учитываем gap между ячейками

        const playhead = playheadRef.current;
        if (playhead) {
            playhead.style.transform = `translateX(${currentStep * stepWidth}px)`;
        }
    }, [currentStep, totalSteps, sequencerRef]);

    return <div ref={playheadRef} className="playhead"></div>;
}

export default PlayHead;
