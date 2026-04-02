'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import type { Transaction } from '@/lib/parsers/types';

type AppState = 'upload' | 'parsing' | 'preview' | 'result';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setState('parsing');
    setError(null);

    try {
      const { parsePdf } = await import('@/lib/parsers/bankJago');
      const result = await parsePdf(file);
      setTransactions(result);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses PDF');
      setState('upload');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">RecapMutasi</h1>
        <p className="text-center text-gray-600 mb-8">
          Konversi mutasi bank PDF menjadi laporan keuangan siap WhatsApp
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {state === 'upload' && <UploadZone onFileSelected={handleFileSelected} />}

        {state === 'parsing' && (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Memproses PDF...</p>
          </div>
        )}

        {state === 'preview' && (
          <p className="text-center">Preview placeholder — {transactions.length} transaksi</p>
        )}

        {state === 'result' && (
          <p className="text-center">Result placeholder</p>
        )}
      </div>
    </main>
  );
}
