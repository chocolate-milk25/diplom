// Synth.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import './Synth.css';

const OSC_TYPES = [
  { value: 'sine', label: 'Синус' },
  { value: 'square', label: 'Меандр' },
  { value: 'sawtooth', label: 'Пила' },
  { value: 'triangle', label: 'Треугольник' }
];

const FILTER_TYPES = [
  { value: 'lowpass', label: 'Низкие' },
  { value: 'highpass', label: 'Высокие' },
  { value: 'bandpass', label: 'Полоса' },
  { value: 'notch', label: 'Режектор' }
];

export default function Synth({ refPlayNote, refStopNote, settings, audioStarted, onSettingsChange }) {
  // Refs для аудио узлов
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const filterRef = useRef(null);
  const envelopeRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const distortionRef = useRef(null);
  const delayRef = useRef(null);
  const reverbRef = useRef(null);
  const [octave, setOctave] = useState(4);

  // Состояния синтезатора
  const [osc1, setOsc1] = useState({
    type: 'square',
    detune: 0,
    volume: 0.7
  });

  const [osc2, setOsc2] = useState({
    type: 'sawtooth',
    detune: 7,
    volume: 0.3
  });

  const [filter, setFilter] = useState({
    type: 'lowpass',
    frequency: 1200,
    Q: 1,
    envAmount: 500
  });

  const [envelope, setEnvelope] = useState({
    attack: 0.1,
    decay: 0.3,
    sustain: 0.7,
    release: 0.5
  });

  const [effects, setEffects] = useState({
    distortion: 0,
    delay: 0.3,
    reverb: 0.3
  });

  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({
        osc1,
        osc2,
        filter,
        envelope,
        effects
      });
    }
  }, []);

  

  // Инициализация аудио графа
  useEffect(() => {
    // Создание эффектов
    distortionRef.current = new Tone.Distortion(0);
    delayRef.current = new Tone.FeedbackDelay(0.3, 0.5);
    reverbRef.current = new Tone.Reverb(0.3);
    
    // Создание осцилляторов
    osc1Ref.current = new Tone.Oscillator(440, osc1.type).start();
    osc2Ref.current = new Tone.Oscillator(440, osc2.type).start();
    
    // Создание фильтра
    filterRef.current = new Tone.Filter({
      type: filter.type,
      frequency: filter.frequency,
      Q: filter.Q
    });
    
    // Огибающая
    envelopeRef.current = new Tone.AmplitudeEnvelope({
      attack: envelope.attack,
      decay: envelope.decay,
      sustain: envelope.sustain,
      release: envelope.release
    });
    
    // Анализатор
    analyserRef.current = new Tone.Analyser('waveform', 256);
    
    // Соединение узлов
    osc1Ref.current.chain(
      envelopeRef.current,
      filterRef.current,
      distortionRef.current,
      delayRef.current,
      reverbRef.current,
      analyserRef.current,
      Tone.Destination
    );
    
    osc2Ref.current.chain(
      envelopeRef.current,
      filterRef.current,
      distortionRef.current,
      delayRef.current,
      reverbRef.current,
      analyserRef.current,
      Tone.Destination
    );

    // Инициализация реверба
    reverbRef.current.generate();

    // Визуализация
    const drawWaveform = () => {
      requestAnimationFrame(drawWaveform);
      if (!canvasRef.current || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const waveform = analyserRef.current.getValue();
      
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < waveform.length; i++) {
        const x = (i / waveform.length) * width;
        const y = (1 - (waveform[i] + 1) / 2) * height;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    };
    
    drawWaveform();
    
    return () => {
      osc1Ref.current.dispose();
      osc2Ref.current.dispose();
      filterRef.current.dispose();
      envelopeRef.current.dispose();
      distortionRef.current.dispose();
      delayRef.current.dispose();
      reverbRef.current.dispose();
      analyserRef.current.dispose();
    };
  }, []);

  // Обновление эффектов
  useEffect(() => {
    if (!distortionRef.current || !delayRef.current || !reverbRef.current) return;
    
    distortionRef.current.distortion = effects.distortion;
    delayRef.current.wet.value = effects.delay;
    reverbRef.current.wet.value = effects.reverb;
  }, [effects]);

  // Обновление параметров осцилляторов
  useEffect(() => {
    if (!osc1Ref.current || !osc2Ref.current) return;
    osc1Ref.current.type = osc1.type;
    osc1Ref.current.detune.value = osc1.detune;
    osc2Ref.current.type = osc2.type;
    osc2Ref.current.detune.value = osc2.detune;
  }, [osc1, osc2]);

  // Обновление фильтра
  useEffect(() => {
    if (!filterRef.current) return;
    filterRef.current.type = filter.type;
    filterRef.current.frequency.value = filter.frequency;
    filterRef.current.Q.value = filter.Q;
  }, [filter]);

  // Обновление огибающей
  useEffect(() => {
    if (!envelopeRef.current) return;
    envelopeRef.current.attack = envelope.attack;
    envelopeRef.current.decay = envelope.decay;
    envelopeRef.current.sustain = envelope.sustain;
    envelopeRef.current.release = envelope.release;
  }, [envelope]);

  // Воспроизведение ноты
  const playNote = (freq) => {
    if (!osc1Ref.current || !osc2Ref.current || !envelopeRef.current) return;
    
    osc1Ref.current.frequency.value = freq;
    osc2Ref.current.frequency.value = freq;
    
    envelopeRef.current.triggerAttackRelease('8n');
    
    return () => {
      envelopeRef.current.triggerRelease();
    };
  };

  // Прокидывание методов воспроизведения наружу
  useEffect(() => {
    if (refPlayNote) refPlayNote.current = playNote;
    if (refStopNote) refStopNote.current = (release) => release?.();
  }, [playNote, refPlayNote, refStopNote]);

  // Компоненты регуляторов
  const Knob = ({ label, value, min, max, onChange, step = 0.01 }) => (
    <div className="vst-knob">
      <div className="knob-label">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="knob"
      />
      <div className="knob-value">{value.toFixed(2)}</div>
    </div>
  );

  

  useEffect(() => {
    if (refPlayNote) refPlayNote.current = playNote;
    if (refStopNote) refStopNote.current = (release) => release?.();
  }, [playNote, refPlayNote, refStopNote]);

  // Обработчик нажатия клавиши клавиатуры
  const handleKeyPress = (note) => {
    const freq = Tone.Midi(`${note}${octave}`).toFrequency();
    playNote(freq);
  };

  const Select = ({ label, value, options, onChange }) => (
    <div className="vst-select">
      <div className="select-label">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="vst-synth">
      <div className="vst-panel">
        <div className="vst-header">
          <h2>СИНТЕЗАТОР МОГ-1</h2>
          <div className="power-switch">
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
            <span>ПИТАНИЕ</span>
          </div>
        </div>

        <div className="vst-section">
          <div className="oscillators">
            <h3>ОСЦИЛЛЯТОР 1</h3>
            <Select
              label="Форма волны"
              value={osc1.type}
              options={OSC_TYPES}
              onChange={(type) => setOsc1({ ...osc1, type })}
            />
            <Knob
              label="Расстройка"
              value={osc1.detune}
              min={-50}
              max={50}
              onChange={(detune) => setOsc1({ ...osc1, detune })}
            />
            <Knob
              label="Громкость"
              value={osc1.volume}
              min={0}
              max={1}
              onChange={(volume) => setOsc1({ ...osc1, volume })}
            />
          </div>

          <div className="oscillators">
            <h3>ОСЦИЛЛЯТОР 2</h3>
            <Select
              label="Форма волны"
              value={osc2.type}
              options={OSC_TYPES}
              onChange={(type) => setOsc2({ ...osc2, type })}
            />
            <Knob
              label="Расстройка"
              value={osc2.detune}
              min={-50}
              max={50}
              onChange={(detune) => setOsc2({ ...osc2, detune })}
            />
            <Knob
              label="Громкость"
              value={osc2.volume}
              min={0}
              max={1}
              onChange={(volume) => setOsc2({ ...osc2, volume })}
            />
          </div>
        </div>

        <div className="vst-section">
          <div className="filter">
            <h3>ФИЛЬТР</h3>
            <Select
              label="Тип фильтра"
              value={filter.type}
              options={FILTER_TYPES}
              onChange={(type) => setFilter({ ...filter, type })}
            />
            <Knob
              label="Частота"
              value={filter.frequency}
              min={20}
              max={20000}
              onChange={(frequency) => setFilter({ ...filter, frequency })}
            />
            <Knob
              label="Резонанс"
              value={filter.Q}
              min={0.1}
              max={20}
              onChange={(Q) => setFilter({ ...filter, Q })}
            />
          </div>

          <div className="envelope">
            <h3>ОГИБАЮЩАЯ</h3>
            <Knob
              label="Атака"
              value={envelope.attack}
              min={0}
              max={2}
              onChange={(attack) => setEnvelope({ ...envelope, attack })}
            />
            <Knob
              label="Спад"
              value={envelope.decay}
              min={0}
              max={2}
              onChange={(decay) => setEnvelope({ ...envelope, decay })}
            />
            <Knob
              label="Сустейн"
              value={envelope.sustain}
              min={0}
              max={1}
              onChange={(sustain) => setEnvelope({ ...envelope, sustain })}
            />
            <Knob
              label="Затухание"
              value={envelope.release}
              min={0}
              max={5}
              onChange={(release) => setEnvelope({ ...envelope, release })}
            />
          </div>
        </div>

        <div className="vst-section">
          <div className="effects">
          <h3>ЭФФЕКТЫ</h3>
          <Knob
            label="Дисторшн"
            value={effects.distortion}
            min={0}
            max={1}
            step={0.01}
            onChange={(distortion) => setEffects({...effects, distortion})}
          />
          <Knob
            label="Дилэй"
            value={effects.delay}
            min={0}
            max={1}
            step={0.01}
            onChange={(delay) => setEffects({...effects, delay})}
          />
          <Knob
            label="Реверб"
            value={effects.reverb}
            min={0}
            max={1}
            step={0.01}
            onChange={(reverb) => setEffects({...effects, reverb})}
          />
        </div>

          <div className="visualizer">
            <h3>ОСЦИЛЛОГРАФ</h3>
            <canvas ref={canvasRef} width={300} height={100}></canvas>
          </div>
        </div>
      </div>
      <div className="vst-section">
        <div className="octave-control">
          <button onClick={() => setOctave(prev => Math.max(2, prev - 1))}>-</button>
          <span>Octave: {octave}</span>
          <button onClick={() => setOctave(prev => Math.min(6, prev + 1))}>+</button>
        </div>
        
        <div className="virtual-keyboard">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note, i) => (
            <button
              key={i}
              className="key"
              onMouseDown={() => handleKeyPress(note)}
            >
              {note}{octave}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}