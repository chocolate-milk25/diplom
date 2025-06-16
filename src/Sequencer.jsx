import React, { useEffect, useRef, useState } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';

const OSC_TYPES = ['sine', 'square', 'sawtooth', 'triangle'];
const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass', 'notch'];

export default function Synth() {
  const audioCtxRef = useRef(null);
  const oscRefs = useRef([]);
  const gainNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const panNodeRef = useRef(null);
  const envelopeGainRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameId = useRef(null);

  const canvasRef = useRef(null);

  const [oscSettings, setOscSettings] = useState([
    { type: 'sine', detune: 0, volume: 0.5 },
    { type: 'square', detune: 0, volume: 0.5 },
  ]);

  const [filterSettings, setFilterSettings] = useState({
    type: 'lowpass',
    frequency: 1000,
    Q: 1,
  });

  const [envelope, setEnvelope] = useState({
    attack: 0.1,
    decay: 0.1,
    sustain: 0.7,
    release: 0.3,
  });

  const [pan, setPan] = useState(0);

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();

    gainNodeRef.current = audioCtxRef.current.createGain();
    envelopeGainRef.current = audioCtxRef.current.createGain();
    filterNodeRef.current = audioCtxRef.current.createBiquadFilter();
    panNodeRef.current = audioCtxRef.current.createStereoPanner();
    analyserRef.current = audioCtxRef.current.createAnalyser();

    analyserRef.current.fftSize = 2048;

    envelopeGainRef.current.connect(filterNodeRef.current);
    filterNodeRef.current.connect(panNodeRef.current);
    panNodeRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioCtxRef.current.destination);

    gainNodeRef.current.gain.value = 1;

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!filterNodeRef.current) return;
    const now = audioCtxRef.current.currentTime;
    filterNodeRef.current.type = filterSettings.type;
    filterNodeRef.current.frequency.setTargetAtTime(filterSettings.frequency, now, 0.01);
    filterNodeRef.current.Q.setTargetAtTime(filterSettings.Q, now, 0.01);
  }, [filterSettings]);

  useEffect(() => {
    if (!panNodeRef.current) return;
    const now = audioCtxRef.current.currentTime;
    panNodeRef.current.pan.setTargetAtTime(pan, now, 0.01);
  }, [pan]);

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height/2;

      if(i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();

    animationFrameId.current = requestAnimationFrame(drawWaveform);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(drawWaveform);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, []);

  const playNote = (freq) => {
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    oscRefs.current.forEach(({ osc }) => {
      try { osc.stop(now); } catch {}
    });
    oscRefs.current = [];

    oscRefs.current = oscSettings.map(({ type, detune, volume }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      oscGain.gain.value = volume;

      osc.connect(oscGain);
      oscGain.connect(envelopeGainRef.current);

      osc.start(now);

      return { osc, oscGain };
    });

    const env = envelopeGainRef.current.gain;
    env.cancelScheduledValues(now);
    env.setValueAtTime(0, now);
    env.linearRampToValueAtTime(1, now + envelope.attack);
    env.linearRampToValueAtTime(envelope.sustain, now + envelope.attack + envelope.decay);

    return () => {
      const stopTime = ctx.currentTime;
      env.cancelScheduledValues(stopTime);
      env.setValueAtTime(env.value, stopTime);
      env.linearRampToValueAtTime(0, stopTime + envelope.release);

      oscRefs.current.forEach(({ osc }) => {
        osc.stop(stopTime + envelope.release + 0.05);
      });
    };
  };

  // Конвертация MIDI номера в частоту
  const midiToFreq = (midiNumber) => 440 * Math.pow(2, (midiNumber - 69) / 12);

  // Обработчики для react-piano
  const activeNotesRef = useRef(new Set());

  const handlePlayNoteInput = (midiNumber) => {
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (activeNotesRef.current.has(midiNumber)) return; // Уже играет

    const freq = midiToFreq(midiNumber);
    const stopFunc = playNote(freq);

    activeNotesRef.current.add(midiNumber);
    // Сохраняем stop функцию для остановки
    // Для упрощения, можно запомнить в Map, но здесь ограничимся одним голосом.
  };

  const handleStopNoteInput = (midiNumber) => {
    if (!activeNotesRef.current.has(midiNumber)) return;
    activeNotesRef.current.delete(midiNumber);
    // Просто останавливаем все осцилляторы для упрощения (можно усложнить, чтобы по ноте)
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const env = envelopeGainRef.current.gain;

    env.cancelScheduledValues(now);
    env.setValueAtTime(env.value, now);
    env.linearRampToValueAtTime(0, now + envelope.release);

    oscRefs.current.forEach(({ osc }) => {
      osc.stop(now + envelope.release + 0.05);
    });
  };

  // Диапазон для полного фортепиано: A0(21) - C8(108)
  const firstNote = MidiNumbers.fromNote('A0');
  const lastNote = MidiNumbers.fromNote('C8');
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote,
    lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 900 }}>
      <h2>Синтезатор с несколькими осцилляторами и визуализацией</h2>

      {/* Клавиатура */}
      <div style={{ marginBottom: 20 }}>
        <Piano
          noteRange={{ first: firstNote, last: lastNote }}
          playNote={handlePlayNoteInput}
          stopNote={handleStopNoteInput}
          width={880}
          keyboardShortcuts={keyboardShortcuts}
        />
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Осцилляторы */}
        <div>
          <h3>Осцилляторы</h3>
          {oscSettings.map((osc, i) => (
            <div key={i} style={{ marginBottom: 12, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
              <label>
                Тип:
                <select value={osc.type} onChange={e => handleOscTypeChange(i, e.target.value)} style={{ marginLeft: 6 }}>
                  {OSC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <br />
              <label>
                Детюн (полутон):
                <input
                  type="number"
                  min={-24}
                  max={24}
                  value={osc.detune}
                  onChange={e => handleOscDetuneChange(i, Number(e.target.value))}
                  style={{ width: 60, marginLeft: 6 }}
                />
              </label>
              <br />
              <label>
                Громкость:
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={osc.volume}
                  onChange={e => handleOscVolumeChange(i, Number(e.target.value))}
                  style={{ width: 100, marginLeft: 6 }}
                />
                {osc.volume.toFixed(2)}
              </label>
            </div>
          ))}
        </div>

        {/* Фильтр */}
        <div>
          <h3>Фильтр</h3>
          <label>
            Тип:
            <select
              value={filterSettings.type}
              onChange={e => setFilterSettings({...filterSettings, type: e.target.value})}
              style={{ marginLeft: 6 }}
            >
              {FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <br />
          <label>
            Частота (Hz):
            <input
              type="range"
              min={100}
              max={5000}
              step={1}
              value={filterSettings.frequency}
              onChange={e => setFilterSettings({...filterSettings, frequency: Number(e.target.value)})}
              style={{ width: 120, marginLeft: 6 }}
            />
            {filterSettings.frequency}
          </label>
          <br />
          <label>
            Q (качество):
            <input
              type="range"
              min={0.1}
              max={20}
              step={0.1}
              value={filterSettings.Q}
              onChange={e => setFilterSettings({...filterSettings, Q: Number(e.target.value)})}
              style={{ width: 120, marginLeft: 6 }}
            />
            {filterSettings.Q.toFixed(1)}
          </label>
        </div>

        {/* Энвелоп */}
        <div>
          <h3>Энвелоп (огибающая)</h3>
          {['attack', 'decay', 'sustain', 'release'].map(param => (
            <label key={param} style={{ display: 'block', marginBottom: 10 }}>
              {param.charAt(0).toUpperCase() + param.slice(1)}:
              <input
                type={param === 'sustain' ? 'range' : 'number'}
                min={param === 'sustain' ? 0 : 0}
                max={param === 'sustain' ? 1 : 5}
                step={param === 'sustain' ? 0.01 : 0.01}
                value={envelope[param]}
                onChange={e => setEnvelope({...envelope, [param]: Number(e.target.value)})}
                style={{ width: 100, marginLeft: 6 }}
              />
              {envelope[param]}
            </label>
          ))}
        </div>

        {/* Панорамирование */}
        <div>
          <h3>Панорама</h3>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={pan}
            onChange={e => setPan(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <div>{pan.toFixed(2)}</div>
        </div>
      </div>

      {/* Визуализация */}
      <canvas
        ref={canvasRef}
        width={880}
        height={120}
        style={{ marginTop: 20, border: '1px solid #ccc', background: '#000' }}
      />
    </div>
  );

  function handleOscTypeChange(i, val) {
    const newOsc = [...oscSettings];
    newOsc[i].type = val;
    setOscSettings(newOsc);
  }

  function handleOscDetuneChange(i, val) {
    const newOsc = [...oscSettings];
    newOsc[i].detune = val;
    setOscSettings(newOsc);
  }

  function handleOscVolumeChange(i, val) {
    const newOsc = [...oscSettings];
    newOsc[i].volume = val;
    setOscSettings(newOsc);
  }
}
