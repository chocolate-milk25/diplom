import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
// стили из popup.css

export default function Equalizer({ filters, onClose }) {
  const canvasRef = useRef(null);
  const [gains, setGains] = useState(filters.map(f => f.gain.value));

  const updateGain = (i, val) => {
    const v = parseFloat(val);
    filters[i].gain.value = v;
    setGains(gains => {
      const g2 = [...gains];
      g2[i] = v;
      return g2;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = filters[2].context.createAnalyser();
    filters[2].connect(analyser);
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let x = 0;
      const w = canvas.width / data.length;
      data.forEach(v => {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(x, canvas.height - v / 2, w, v / 2);
        x += w;
      });
      requestAnimationFrame(draw);
    };
    draw();
  }, [filters]);

  return (
    <Draggable>
      <div className="popup">
        <div className="popup-header">
          Эквалайзер
          <button onClick={onClose}>✕</button>
        </div>
        <canvas ref={canvasRef} width={300} height={100} />
        <div className="sliders">
          {['Low', 'Mid', 'High'].map((lbl, i) => (
            <div key={i}>
              <label>{lbl}</label>
              <input type="range" min="-30" max="30" step="0.1"
                value={gains[i]} onChange={e => updateGain(i, e.target.value)} />
              <span>{gains[i].toFixed(1)} dB</span>
            </div>
          ))}
        </div>
      </div>
    </Draggable>
  );
}
