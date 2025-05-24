import React, { useEffect, useRef } from "react";

const Visualizer = ({ analyser }) => {
  const canvasRef = useRef(null);

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

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={150}
      style={{ backgroundColor: "#000", border: "1px solid #333", margin: "20px auto", display: "block" }}
    />
  );
};

export default Visualizer;
