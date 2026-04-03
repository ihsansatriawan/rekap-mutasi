'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/parsers/types';
import { CategoryDropdown } from '@/components/ui/CategoryDropdown';

interface TransactionPreviewProps {
  transactions: Transaction[];
  onConfirm: (transactions: Transaction[]) => void;
  onBack: () => void;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function TransactionPreview({
  transactions: initialTransactions,
  onConfirm,
  onBack,
}: TransactionPreviewProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const handleCategoryChange = (index: number, category: string) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, category } : t))
    );
  };

  const handleAddCategory = (category: string) => {
    setCustomCategories((prev) =>
      prev.includes(category) ? prev : [...prev, category]
    );
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      {/* Heading */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: 0 }}>
          Validasi Transaksi
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
          Klik badge kategori untuk mengubah · {transactions.length} transaksi ditemukan
        </p>
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'rgb(27,28,30) 0px 0px 0px 1px, rgb(7,8,10) 0px 0px 0px 1px inset',
        marginBottom: '20px',
      }}>
        {/* Card header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {transactions.length} Transaksi
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'hsla(151, 59%, 59%, 0.12)',
              color: 'hsl(151, 59%, 59%)',
              border: '1px solid rgba(95,201,146,0.2)',
            }}>
              ↑ {formatRupiah(totalIncome)}
            </span>
            <span style={{
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'hsla(0, 100%, 69%, 0.15)',
              color: '#FF6363',
              border: '1px solid rgba(255,99,99,0.2)',
            }}>
              ↓ {formatRupiah(totalExpense)}
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tanggal', 'Deskripsi', 'Jumlah', 'Kategori'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: i === 2 ? 'right' : 'left',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: i === transactions.length - 1 ? 'none' : '1px solid var(--border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {t.date}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '280px' }}>
                    {t.description}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                    color: t.type === 'credit' ? 'hsl(151, 59%, 59%)' : '#FF6363',
                    letterSpacing: 0,
                  }}>
                    {t.type === 'credit' ? '+' : '−'}{formatRupiah(t.amount)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <CategoryDropdown
                      value={t.category}
                      onChange={(cat) => handleCategoryChange(i, cat)}
                      customCategories={customCategories}
                      onAddCategory={handleAddCategory}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', fontSize: '14px', fontWeight: 500,
            color: 'var(--text-tertiary)', background: 'transparent', border: 'none',
            borderRadius: '9999px', cursor: 'pointer', letterSpacing: '0.2px',
            fontFamily: 'inherit', transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          ← Upload ulang
        </button>
        <button
          onClick={() => onConfirm(transactions)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', fontSize: '14px', fontWeight: 600,
            color: '#07080a', background: 'hsla(0,0%,100%,0.815)', border: 'none',
            borderRadius: '9999px', cursor: 'pointer', letterSpacing: '0.3px',
            fontFamily: 'inherit', transition: 'background 0.15s',
            boxShadow: 'rgba(255,255,255,0.05) 0px 1px 0px 0px inset, rgba(0,0,0,0.2) 0px -1px 0px 0px inset',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(0,0%,100%)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.815)'; }}
        >
          Generate Laporan →
        </button>
      </div>
    </div>
  );
}
