'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { TransactionPreview } from '@/components/TransactionPreview';
import { ReportResult } from '@/components/ReportResult';
import type { Transaction } from '@/lib/parsers/types';

type AppState = 'upload' | 'parsing' | 'preview' | 'result';

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'parsing', label: 'Parse' },
  { key: 'preview', label: 'Validasi' },
  { key: 'result', label: 'Laporan' },
] as const;

function getStepIndex(state: AppState): number {
  return STEPS.findIndex((s) => s.key === state);
}

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentStep = getStepIndex(state);

  const handleFileSelected = async (file: File) => {
    setState('parsing');
    setError(null);
    try {
      const { parsePdf } = await import('@/lib/parsers/bankJago');
      const { categorizeAll } = await import('@/lib/categorizer');
      const parsed = await parsePdf(file);
      const result = categorizeAll(parsed);
      setTransactions(result);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses PDF');
      setState('upload');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(7, 8, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            background: 'linear-gradient(135deg, #FF6363 0%, #cc3333 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'rgba(255,255,255,0.1) 0px 1px 0px 0px inset, rgba(0,0,0,0.4) 0px 2px 4px',
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
            RecapMutasi
          </span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.4px',
          color: 'var(--text-tertiary)',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          padding: '3px 10px',
          borderRadius: '9999px',
        }}>
          Bank Jago · Beta
        </span>
      </nav>

      {/* MAIN */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* STEP INDICATOR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '48px' }}>
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: 0,
                    transition: 'all 0.2s',
                    ...(isDone ? {
                      background: 'var(--green)',
                      color: '#07080a',
                    } : isActive ? {
                      background: 'var(--surface-raised)',
                      color: 'var(--text-primary)',
                      boxShadow: 'rgba(255,255,255,0.25) 0px 0px 0px 1px, rgba(255,255,255,0.05) 0px 1px 0px 0px inset, rgba(0,0,0,0.2) 0px -1px 0px 0px inset',
                    } : {
                      background: 'transparent',
                      color: 'var(--text-tertiary)',
                      border: '1px solid var(--border)',
                    }),
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase' as const,
                    color: isDone ? 'var(--green)' : isActive ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                  }}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    width: '56px',
                    height: '1px',
                    background: i < currentStep ? 'rgba(95,201,146,0.4)' : 'var(--border)',
                    marginBottom: '24px',
                    flexShrink: 0,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            background: 'var(--red-tint)',
            border: '1px solid rgba(255,99,99,0.2)',
            color: 'var(--red)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* STATE VIEWS */}
        {state === 'upload' && <UploadZone onFileSelected={handleFileSelected} />}

        {state === 'parsing' && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '64px 32px',
            textAlign: 'center',
            boxShadow: 'rgb(27,28,30) 0px 0px 0px 1px, rgb(7,8,10) 0px 0px 0px 1px inset',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--green)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Memproses PDF...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {state === 'preview' && (
          <TransactionPreview
            transactions={transactions}
            onConfirm={(confirmed) => {
              setTransactions(confirmed);
              setState('result');
            }}
            onBack={() => {
              setTransactions([]);
              setState('upload');
            }}
          />
        )}

        {state === 'result' && (
          <ReportResult
            transactions={transactions}
            onBack={() => setState('preview')}
          />
        )}
      </main>
    </div>
  );
}
