import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import styles from './Waveform.module.css';

export default function Waveform({ buffer, onRegionCreated }) {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!buffer || !waveformRef.current) return;

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
        WaveSurfer.regions.create({
          dragSelection: {
            slop: 5
          }
        })
      ]
    });

    if (buffer) {
      wavesurferRef.current.loadDecodedBuffer(buffer.get());
    }

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