import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function Mixer() {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#97a5ff',
      progressColor: '#5865f2',
      backend: 'WebAudio',
    });

    waveSurferRef.current = ws;

    ws.load('/sounds/song.wav');

    ws.on('ready', () => {
      console.log('WaveSurfer готов');
      setIsReady(true);
    });

    // Флаг для предотвращения двойного destroy
    let destroyed = false;

    return () => {
      if (!destroyed && waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
        destroyed = true;
        console.log('WaveSurfer уничтожен');
      }
    };
  }, []);

  useEffect(() => {
    if (isReady && waveSurferRef.current) {
      const backend = waveSurferRef.current.backend;
      if (!backend) {
        console.error('Backend отсутствует!');
        return;
      }
      const audioCtx = backend.ac;
      const source = backend.bufferSource;
      console.log('AudioContext и Source доступны:', audioCtx, source);
    }
  }, [isReady]);

  return (
    <div style={{ width: 600, margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Микшер</h2>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 128, border: '1px solid #ccc', borderRadius: 4 }}
      />
      {!isReady && <p>Загрузка...</p>}
    </div>
  );
}
