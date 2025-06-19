import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { saveAs } from 'file-saver';
import './Sequencer.css';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const OCTAVES = [2, 3, 4, 5, 6];
const STEP_WIDTH = 35;
const MAX_STEPS = 32;

export default function EnhancedSequencer({ synthPlayNote, synthSettings, settings }) {
  const [steps, setSteps] = useState(16);
  const [pattern, setPattern] = useState(() => NOTES.map(() => new Array(MAX_STEPS).fill(0)));
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [octave, setOctave] = useState(4);
  const [dragInfo, setDragInfo] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  
  const transportRef = useRef(null);
  const recorder = useRef(null);
  const bpmRef = useRef(bpm);

  // Инициализация Tone.js
  useEffect(() => {
    transportRef.current = Tone.Transport;
    recorder.current = new Tone.Recorder();
    Tone.getDestination().connect(recorder.current);
    
    return () => {
      transportRef.current.cancel();
      transportRef.current.stop();
    };
  }, []);

  // Обновление ref при изменении BPM
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Логика воспроизведения
  useEffect(() => {
  if (!playing) {
    setCurrentStep(0);
    transportRef.current.cancel();
    return;
  }

  // Установка BPM
  transportRef.current.bpm.value = bpm;

  // Очистка предыдущих событий
  transportRef.current.cancel();

  // Создаем новый loop для визуализации
  let step = 0;
  const loop = new Tone.Loop((time) => {
    setCurrentStep(step);
    
    // Воспроизводим ноты для текущего шага
    pattern.forEach((row, noteIdx) => {
      if (row[step] > 0) { // Если на этом шаге есть нота
        const note = `${NOTES[noteIdx]}${octave}`;
        synthPlayNote(Tone.Midi(note).toFrequency(), time);
      }
    });
    
    step = (step + 1) % steps;
  }, "16n").start(0);

  transportRef.current.start();

  return () => {
    loop.dispose();
    transportRef.current.cancel();
  };
}, [playing, bpm, steps, pattern, octave, synthPlayNote]);

  // Обработчик изменения BPM
  const handleBpmChange = (e) => {
    const newBpm = Math.min(300, Math.max(30, Number(e.target.value)));
    setBpm(newBpm);
    
    if (playing) {
      transportRef.current.bpm.rampTo(newBpm, 0.1);
    }
  };

  // Переключение ноты
  const toggleNote = (noteIdx, stepIdx, isRightClick = false) => {
    if (stepIdx >= steps) return;
    
    setPattern(p => {
      const newP = p.map(row => [...row]);
      
      if (isRightClick) {
        // Удаление ноты
        const length = newP[noteIdx][stepIdx];
        if (length > 0) {
          for (let i = stepIdx; i < stepIdx + length; i++) {
            if (i < steps) newP[noteIdx][i] = 0;
          }
        }
      } else {
        // Добавление ноты
        if (newP[noteIdx][stepIdx] === 0) {
          newP[noteIdx][stepIdx] = 1;
        }
      }
      
      return newP;
    });
  };

  // Начало перетаскивания для изменения длительности
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

  // Логика перетаскивания для изменения длительности
  useEffect(() => {
    if (!dragInfo) return;

    const onMouseMove = e => {
      const deltaX = e.clientX - dragInfo.startX;
      const deltaSteps = Math.round(deltaX / STEP_WIDTH);
      let newLength = Math.max(1, Math.min(
        steps - dragInfo.stepIndex,
        dragInfo.startLength + deltaSteps
      ));

      setPattern(p => {
        const newP = p.map(row => [...row]);
        
        // Очистить старую ноту
        for (let i = dragInfo.stepIndex; i < dragInfo.stepIndex + dragInfo.startLength; i++) {
          if (i < steps) newP[dragInfo.noteIndex][i] = 0;
        }
        
        // Установить новую длительность
        newP[dragInfo.noteIndex][dragInfo.stepIndex] = newLength;
        return newP;
      });
    };

    const onMouseUp = () => setDragInfo(null);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragInfo, steps]);

  // Предпросмотр ноты при наведении
  const previewNote = (noteIdx) => {
    const note = `${NOTES[noteIdx]}${octave}`;
    const freq = Tone.Midi(note).toFrequency();
    synthPlayNote(freq);
    setActiveNotes(prev => [...prev, note]);
    
    setTimeout(() => {
      setActiveNotes(prev => prev.filter(n => n !== note));
    }, 500);
  };

  // Экспорт паттерна
  const exportPattern = () => {
    const data = {
      pattern: pattern.map(row => row.slice(0, steps)),
      bpm,
      steps,
      octave,
      synthSettings
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    saveAs(blob, 'pattern.json');
  };

  // Импорт паттерна
  const importPattern = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const importedSteps = data.steps || 16;
        
        setPattern(NOTES.map((_, i) => {
          const row = new Array(MAX_STEPS).fill(0);
          const importedRow = data.pattern?.[i] || [];
          for (let j = 0; j < Math.min(importedRow.length, MAX_STEPS); j++) {
            row[j] = importedRow[j] || 0;
          }
          return row;
        }));
        
        setBpm(data.bpm || bpm);
        setSteps(importedSteps);
        setOctave(data.octave || octave);
      } catch (err) {
        console.error('Error parsing pattern file', err);
      }
    };
    reader.readAsText(file);
  };

  // Экспорт WAV
  const exportWav = async () => {
  try {
    // Рассчитываем полную длительность в секундах
    const sixteenthNotesPerMeasure = 16;
    const secondsPerMeasure = 60 / bpm * 4; // 4/4 такт
    const sixteenthNoteDuration = secondsPerMeasure / sixteenthNotesPerMeasure;
    const totalDuration = steps * sixteenthNoteDuration;
    
    // Начинаем запись
    await recorder.current.start();
    
    // Запускаем воспроизведение
    setPlaying(true);
    
    // Ждем полную длительность + небольшой запас
    await new Promise(resolve => {
      setTimeout(() => {
        setPlaying(false);
        resolve();
      }, totalDuration * 1000 + 500); // +500ms запас
    });
    
    // Останавливаем запись и получаем данные
    const recording = await recorder.current.stop();
    
    // Создаем и скачиваем файл
    const url = URL.createObjectURL(recording);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequence_${bpm}bpm.wav`;
    a.click();
    
    // Освобождаем память
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error during export:', error);
    setPlaying(false);
    recorder.current.stop();
  }
};

  // Рендер клавиатуры
  const renderKeyboard = () => (
    <div className="virtual-keyboard">
      {NOTES.map((note, i) => (
        <button
          key={i}
          className={`key ${activeNotes.includes(`${note}${octave}`) ? 'active' : ''}`}
          onMouseDown={() => previewNote(i)}
        >
          {note}{octave}
        </button>
      ))}
    </div>
  );

  // Рендер сетки
  const renderGrid = () => {
    return pattern.map((row, noteIdx) => {
      const cells = [];
      let skipSteps = 0;
      
      for (let stepIdx = 0; stepIdx < MAX_STEPS; stepIdx++) {
        if (skipSteps > 0) {
          skipSteps--;
          continue;
        }

        const length = stepIdx < steps ? row[stepIdx] : 0;
        
        if (length > 0) {
          cells.push(
            <div
              key={stepIdx}
              className={`step-cell ${stepIdx < steps ? 'active' : 'inactive'} ${
                currentStep === stepIdx ? 'current' : ''
              }`}
              style={{ width: STEP_WIDTH * length }}
              onClick={() => toggleNote(noteIdx, stepIdx)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleNote(noteIdx, stepIdx, true);
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
              onClick={() => toggleNote(noteIdx, stepIdx)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleNote(noteIdx, stepIdx, true);
              }}
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
        
        <div className="bpm-control">
          <input 
            type="range" 
            min="30" 
            max="300" 
            value={bpm} 
            onChange={handleBpmChange} 
          />
          <span>BPM: {bpm}</span>
        </div>

        <div className="octave-control">
          <button onClick={() => setOctave(Math.max(...OCTAVES, octave - 1))}>-</button>
          <span>Octave: {octave}</span>
          <button onClick={() => setOctave(Math.min(...OCTAVES, octave + 1))}>+</button>
        </div>

        <div className="steps-control">
          <button onClick={() => setSteps(Math.max(4, steps - 1))}>-</button>
          <span>Steps: {steps}</span>
          <button onClick={() => setSteps(Math.min(MAX_STEPS, steps + 1))}>+</button>
        </div>

        <button onClick={exportPattern}>Export Pattern</button>
        <button onClick={exportWav}>Export WAV</button>
        <label className="import-btn">
          Import Pattern
          <input type="file" accept=".json" onChange={importPattern} style={{ display: 'none' }} />
        </label>
      </div>
      
      {renderKeyboard()}
      
      <div className="piano-roll">
        <div className="steps-grid">{renderGrid()}</div>
      </div>
    </div>
  );
}