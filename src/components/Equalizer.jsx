import React, { useEffect, useRef, useState } from "react";

const labels = ["Low Shelf", "Mid Peak", "High Shelf"];

const Equalizer = ({ filters, analyser }) => {
  // Инициализируем gains, если фильтры валидны
  const initialGains =
    filters && filters.length === 3 && filters.every(f => f && f.gain)
      ? filters.map(f => f.gain.value)
      : [0, 0, 0]; // если фильтров нет, по умолчанию 0

  const [gains, setGains] = useState(initialGains);
  const canvasRef = useRef(null);

  // Синхронизируем gains при изменении фильтров
  useEffect(() => {
    if (filters && filters.length === 3 && filters.every(f => f && f.gain)) {
      setGains(filters.map(f => f.gain.value));
    }
  }, [filters]);

  // Спектр-анализатор — рисуем анимацию спектра
  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId;

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        ctx.fillStyle = "lime";
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyser]);

  // Если фильтры не валидны — не рендерим компонент
  if (!filters || filters.length !== 3 || filters.some(f => !f || !f.gain)) return null;

  // Обработчик изменения gain
  const handleGainChange = (index, e) => {
    const gainValue = parseFloat(e.target.value);
    // Обновляем значение в самом фильтре Web Audio API
    filters[index].gain.value = gainValue;
    // Обновляем состояние gains в React, чтобы перерендерить input и label
    setGains(prev => {
      const newGains = [...prev];
      newGains[index] = gainValue;
      return newGains;
    });
  };

  return (
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        style={{ backgroundColor: "#000", border: "1px solid #333", marginBottom: "20px" }}
      />
      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {filters.map((filter, idx) => {
          // Берём значение gain из состояния, если нет — ставим 0
          const gainValue = gains[idx] ?? 0;
          return (
            <div key={idx} style={{ textAlign: "center" }}>
              <label>{labels[idx]}</label>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.1}
                value={gainValue}
                onChange={(e) => handleGainChange(idx, e)}
                style={{ writingMode: "bt-lr", height: "120px" }}
              />
              <div style={{ marginTop: "5px", fontSize: "14px", color: "#ccc" }}>
                {gainValue.toFixed(1)} dB
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Equalizer;
