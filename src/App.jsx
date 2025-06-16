import { useState } from 'react';
import Mixer from './Mixer';
import Sequencer from './Sequencer';

export default function App() {
  const [mode, setMode] = useState('mixer');
  return (
    <div>
      <header>
        <button onClick={() => setMode('mixer')}>Миксер</button>
        <button onClick={() => setMode('sequencer')}>Секвенсор</button>
      </header>
      {mode === 'mixer' ? <Mixer /> : <Sequencer />}
    </div>
  );
}
