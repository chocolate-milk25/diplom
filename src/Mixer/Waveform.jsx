import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/src/plugin/regions';
import styles from './Waveform.module.css';

export default function Waveform({ buffer, onRegionCreated }) {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!buffer || !waveformRef.current) return;

    // Инициализация Wavesurfer с плагином
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4CAF50',
      progressColor: '#2E7D32',
      cursorColor: '#FF5722',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 1,
      height: 80,
      barGap: 2,
      responsive: true,
      normalize: true,
      plugins: [
        RegionsPlugin.create({
          dragSelection: {
            slop: 5,
            color: 'rgba(255, 87, 34, 0.3)'
          }
        })
      ]
    });

    // Загрузка аудиобуфера
    wavesurferRef.current.loadDecodedBuffer(buffer.get());

    // Обработчик создания региона
    wavesurferRef.current.on('region-created', (region) => {
      if (onRegionCreated) {
        onRegionCreated({
          start: region.start,
          end: region.end,
          id: region.id
        });
      }
    });

    return () => {
      wavesurferRef.current.destroy();
    };
  }, [buffer]);

  return <div ref={waveformRef} className={styles.waveformContainer} />;
}