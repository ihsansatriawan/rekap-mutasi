'use client';

import { useCallback, useState } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.type !== 'application/pdf') {
        setError('File harus berformat PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '0' }}>
          Upload Mutasi Bank
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
          Drag &amp; drop file PDF mutasi Bank Jago kamu
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          background: isDragging ? 'rgba(95,201,146,0.04)' : 'var(--surface)',
          border: `1px solid ${isDragging ? 'rgba(95,201,146,0.3)' : 'var(--border-subtle)'}`,
          borderRadius: '12px',
          padding: '64px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: 'rgb(27,28,30) 0px 0px 0px 1px, rgb(7,8,10) 0px 0px 0px 1px inset',
          transition: 'border-color 0.15s, background 0.15s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,99,99,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          id="pdf-upload"
        />

        <div style={{
          width: '52px',
          height: '52px',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: 'rgba(255,255,255,0.05) 0px 1px 0px 0px inset, rgba(0,0,0,0.3) 0px 4px 8px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 12 15 15"/>
          </svg>
        </div>

        <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '0.2px' }}>
            Drag &amp; drop file PDF di sini
          </p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
            atau klik untuk pilih file
          </p>
        </label>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '20px',
          padding: '5px 12px',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.4px',
        }}>
          <span style={{ color: 'var(--green)', fontSize: '8px' }}>●</span>
          PDF · Maks. 10MB · Privasi terjaga
        </div>
      </div>

      {error && (
        <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 500, color: 'var(--red)', letterSpacing: '0.2px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
