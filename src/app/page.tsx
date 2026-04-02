'use client';

import { useState } from 'react';

type AppState = 'upload' | 'parsing' | 'preview' | 'result';

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, setState] = useState<AppState>('upload');

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">RecapMutasi</h1>
        <p className="text-center text-gray-600 mb-8">
          Konversi mutasi bank PDF menjadi laporan keuangan siap WhatsApp
        </p>
        {state === 'upload' && <p className="text-center">Upload zone placeholder</p>}
        {state === 'parsing' && <p className="text-center">Parsing...</p>}
        {state === 'preview' && <p className="text-center">Preview placeholder</p>}
        {state === 'result' && <p className="text-center">Result placeholder</p>}
      </div>
    </main>
  );
}
