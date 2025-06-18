// EnhancedSequencer.jsx
import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { saveAs } from 'file-saver';
import './Sequencer.css';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const OCTAVES = [2, 3, 4, 5, 6];
const STEP_WIDTH = 35; // Увеличил ширину шага

export default function EnhancedSequencer({ synthPlayNote, synthSettings, settings }) {
  const [steps, setSteps] = useState(16);
  const [pattern, setPattern] = useState(() => 
    NOTES.map(() => new Array(32).fill(0)) // Изначально создаём массив на 32 шага
  );
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [octave, setOctave] = useState(4);
  const [dragInfo, setDragInfo] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const transportRef = useRef(null);

  // Инициализация Tone.js
  useEffect(() => {
    transportRef.current = Tone.Transport;
    return () => {
      transportRef.current.cancel();
    };
  }, []);

  // Playback logic
  useEffect(() => {
    if (!playing) {
      setCurrentStep(0);
      transportRef.current.cancel();
      return;
    }
    
    transportRef.current.bpm.value = bpm;
    transportRef.current.cancel();
    
    // Schedule all notes with synth settings
    pattern.forEach((row, noteIdx) => {
      row.forEach((duration, stepIdx) => {
        if (stepIdx >= steps) return;
        if (duration > 0) {
          const time = stepIdx * 0.25;
          const note = `${NOTES[noteIdx]}${octave}`;
          
          transportRef.current.schedule(time => {
            // Создаем временный синтезатор с текущими настройками
            if (!synthSettings) {
              synthPlayNote(Tone.Midi(note).toFrequency());
              return;
            }

            const tempSynth = new Tone.PolySynth(Tone.Synth).toDestination();
            
            // Применяем настройки
            tempSynth.get().oscillator.type = synthSettings.osc1.type;
            tempSynth.get().envelope.attack = synthSettings.envelope.attack;
            tempSynth.get().envelope.decay = synthSettings.envelope.decay;
            tempSynth.get().envelope.sustain = synthSettings.envelope.sustain;
            tempSynth.get().envelope.release = synthSettings.envelope.release;
            
            // Применяем фильтр
            const tempFilter = new Tone.Filter({
              frequency: synthSettings.filter.frequency,
              type: synthSettings.filter.type,
              Q: synthSettings.filter.Q
            }).toDestination();
            
            tempSynth.connect(tempFilter);
            
            // Воспроизводим ноту
            tempSynth.triggerAttackRelease(note, "8n", time);
            
            // Очистка после воспроизведения
            setTimeout(() => {
              tempSynth.dispose();
              tempFilter.dispose();
            }, 1000);
          }, time);
        }
      });
    });
    
    let step = 0;
    const loop = new Tone.Loop(time => {
      setCurrentStep(step);
      step = (step + 1) % steps;
    }, "16n").start(0);
    
    transportRef.current.start();
    
    return () => {
      loop.dispose();
      transportRef.current.stop();
    };
  }, [playing, bpm, steps, pattern, octave, synthSettings]);

  // Handle note toggle
  const toggleNote = (noteIdx, stepIdx, isRightClick = false) => {
    if (stepIdx >= steps) return; // Не позволяем ставить ноты за пределами текущего количества шагов
    
    if (isRightClick) {
      // Clear note
      const newPattern = [...pattern];
      const length = newPattern[noteIdx][stepIdx];
      if (length > 0) {
        for (let i = stepIdx; i < stepIdx + length; i++) {
          if (i < steps) newPattern[noteIdx][i] = 0;
        }
      }
      setPattern(newPattern);
    } else {
      // Add note with duration 1 if empty
      if (pattern[noteIdx][stepIdx] === 0) {
        const newPattern = [...pattern];
        newPattern[noteIdx][stepIdx] = 1;
        setPattern(newPattern);
      }
    }
  };

  // Handle note drag start
  const onDragStart = (e, noteIndex, stepIndex) => {
    e.preventDefault();
    if (pattern[noteIndex][stepIndex] === 0) return;
    setDragInfo({
      noteIndex,
      stepIndex,
      startX: e.clientX,
      startLength: pattern[noteIndex][stepIndex],
    });
  };

  // Handle note dragging
  useEffect(() => {
    if (!dragInfo) return;

    const onMouseMove = e => {
      const deltaX = e.clientX - dragInfo.startX;
      const deltaSteps = Math.round(deltaX / STEP_WIDTH);

      let newLength = dragInfo.startLength + deltaSteps;
      if (newLength < 1) newLength = 1;
      if (newLength > steps - dragInfo.stepIndex) {
        newLength = steps - dragInfo.stepIndex;
      }

      setPattern(p => {
        const newP = p.map(row => [...row]); // Глубокая копия

        // Clear old note
        for (
          let i = dragInfo.stepIndex;
          i < dragInfo.stepIndex + dragInfo.startLength;
          i++
        ) {
          if (i < steps) newP[dragInfo.noteIndex][i] = 0;
        }

        // Insert new note with newLength
        newP[dragInfo.noteIndex][dragInfo.stepIndex] = newLength;
        return newP;
      });
    };

    const onMouseUp = () => {
      setDragInfo(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragInfo, steps]);

  // Preview note on hover
  const previewNote = (noteIdx) => {
    const note = `${NOTES[noteIdx]}${octave}`;
    const freq = Tone.Midi(note).toFrequency();
    synthPlayNote(freq);
    setActiveNotes(prev => [...prev, note]);
    
    setTimeout(() => {
      setActiveNotes(prev => prev.filter(n => n !== note));
    }, 500);
  };

  // Export pattern to JSON
  const exportPattern = () => {
    const data = {
      pattern: pattern.map(row => row.slice(0, steps)), // Экспортируем только активные шаги
      bpm,
      steps,
      octave,
      synthSettings
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    saveAs(blob, 'pattern.json');
  };

  // Import pattern from JSON
  const importPattern = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const importedSteps = data.steps || 16;
        
        // Создаём новый паттерн с учётом импортированных данных
        const newPattern = NOTES.map((_, i) => {
          const importedRow = data.pattern?.[i] || [];
          const row = new Array(32).fill(0); // Максимальное количество шагов
          for (let j = 0; j < Math.min(importedRow.length, 32); j++) {
            row[j] = importedRow[j] || 0;
          }
          return row;
        });
        
        setPattern(newPattern);
        setBpm(data.bpm || bpm);
        setSteps(importedSteps);
        setOctave(data.octave || octave);
      } catch (err) {
        console.error('Error parsing pattern file', err);
      }
    };
    reader.readAsText(file);
  };

  // Render virtual keyboard
  const renderKeyboard = () => {
    return (
      <div className="virtual-keyboard">
        {NOTES.map((note, i) => (
          <button
            key={i}
            className={`key ${activeNotes.includes(`${note}${octave}`) ? 'active' : ''}`}
            onClick={() => previewNote(i)}
            onMouseDown={() => previewNote(i)}
          >
            {note}{octave}
          </button>
        ))}
      </div>
    );
  };

  // Render grid
  const renderGrid = () => {
    return pattern.map((row, noteIdx) => {
      const cells = [];
      let skipSteps = 0;
      
      for (let stepIdx = 0; stepIdx < 32; stepIdx++) { // Рендерим все 32 шага
        if (skipSteps > 0) {
          skipSteps--;
          continue;
        }

        const length = stepIdx < steps ? row[stepIdx] : 0; // За пределами steps считаем ноты неактивными
        
        if (length > 0) {
          cells.push(
            <div
              key={stepIdx}
              className={`step-cell ${stepIdx < steps ? 'active' : 'inactive'} ${
                currentStep === stepIdx ? 'current' : ''
              }`}
              style={{ width: STEP_WIDTH * length }}
              onClick={() => stepIdx < steps && toggleNote(noteIdx, stepIdx)}
              onContextMenu={(e) => {
                if (stepIdx < steps) {
                  e.preventDefault();
                  toggleNote(noteIdx, stepIdx, true);
                }
              }}
            >
              {stepIdx < steps && (
                <div
                  className="note-duration-handle"
                  onMouseDown={e => onDragStart(e, noteIdx, stepIdx)}
                  onClick={e => e.stopPropagation()}
                  onContextMenu={e => e.stopPropagation()}
                />
              )}
            </div>
          );
          skipSteps = length - 1;
        } else {
          cells.push(
            <div
              key={stepIdx}
              className={`step-cell ${stepIdx >= steps ? 'hidden' : ''} ${
                currentStep === stepIdx ? 'current' : ''
              }`}
              onClick={() => stepIdx < steps && toggleNote(noteIdx, stepIdx)}
            />
          );
        }
      }
      
      return (
        <div key={noteIdx} className="step-row">
          <div 
            className="note-label" 
            onMouseEnter={() => previewNote(noteIdx)}
          >
            {NOTES[noteIdx]}{octave}
          </div>
          {cells}
        </div>
      );
    });
  };

  return (
    <div className="vst-sequencer">
      <div className="sequencer-controls">
        <button onClick={() => setPlaying(!playing)}>
          {playing ? 'Stop' : 'Play'}
        </button>
        <input 
          type="range" 
          min="30" 
          max="300" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
        />
        <span>BPM: {bpm}</span>
        
        <div className="octave-control">
          <button onClick={() => setOctave(Math.max(Math.min(...OCTAVES), octave - 1))}>
            -
          </button>
          <span>Octave: {octave}</span>
          <button onClick={() => setOctave(Math.min(Math.max(...OCTAVES), octave + 1))}>
            +
          </button>
        </div>
        
        <div className="steps-control">
          <button onClick={() => setSteps(Math.max(4, steps - 1))}>-</button>
          <span>Steps: {steps}</span>
          <button onClick={() => setSteps(Math.min(32, steps + 1))}>+</button>
        </div>
        
        <button onClick={exportPattern}>Export Pattern</button>
        <input type="file" accept=".json" onChange={importPattern} />
      </div>
      
      {renderKeyboard()}
      
      <div className="piano-roll">
        <div className="steps-grid">
          {renderGrid()}
        </div>
      </div>
    </div>
  );
}