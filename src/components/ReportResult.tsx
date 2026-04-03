'use client';

import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '@/lib/parsers/types';
import { formatWhatsAppReport } from '@/lib/reportFormatter';

interface ReportResultProps {
  transactions: Transaction[];
  onBack: () => void;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

const CHART_COLORS = [
  'hsl(151, 59%, 59%)',
  'hsl(202, 100%, 67%)',
  'hsl(43, 100%, 60%)',
  '#FF6363',
  'hsl(270, 60%, 65%)',
  'hsl(320, 60%, 65%)',
  'hsl(180, 60%, 55%)',
  'hsl(30, 80%, 60%)',
];

const customTooltipStyle = {
  backgroundColor: '#1b1c1e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#f9f9f9',
  fontSize: '12px',
  fontWeight: 500,
  boxShadow: 'rgb(7,8,10) 0px 4px 16px',
};

export function ReportResult({ transactions, onBack }: ReportResultProps) {
  const [copied, setCopied] = useState(false);

  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const saldoAkhir = sorted[sorted.length - 1]?.balance ?? 0;

  const expenseByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'debit') {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    }
  }

  const pieData = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const barData = [
    { name: 'Pemasukan', amount: totalIncome },
    { name: 'Pengeluaran', amount: totalExpense },
  ];

  const handleCopy = async () => {
    const report = formatWhatsAppReport(transactions);
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardBase: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: 'rgb(27,28,30) 0px 0px 0px 1px, rgb(7,8,10) 0px 0px 0px 1px inset',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div>
      {/* Heading */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: 0 }}>
          Laporan Keuangan
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
          {sorted[0]?.date} – {sorted[sorted.length - 1]?.date} · Bank Jago
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Income */}
        <div style={cardBase}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'hsl(151, 59%, 59%)', borderRadius: '12px 12px 0 0',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 0%, hsla(151,59%,59%,0.08) 0%, transparent 70%)',
          }} />
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Total Pemasukan
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', color: 'hsl(151, 59%, 59%)' }}>
            {formatRupiah(totalIncome)}
          </div>
        </div>

        {/* Expense */}
        <div style={cardBase}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: '#FF6363', borderRadius: '12px 12px 0 0',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 0%, hsla(0,100%,69%,0.08) 0%, transparent 70%)',
          }} />
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Total Pengeluaran
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', color: '#FF6363' }}>
            {formatRupiah(totalExpense)}
          </div>
        </div>

        {/* Balance */}
        <div style={cardBase}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'var(--text-muted)', borderRadius: '12px 12px 0 0',
          }} />
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Saldo Akhir
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
            {formatRupiah(saldoAkhir)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ ...cardBase, padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
            Breakdown Pengeluaran
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={30}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(value) => [formatRupiah(value as number), '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardBase, padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
            Pemasukan vs Pengeluaran
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={40}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500, letterSpacing: '0.3px' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}jt`}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(value) => [formatRupiah(value as number), '']}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                <Cell fill="hsl(151, 59%, 59%)" />
                <Cell fill="#FF6363" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
          ← Kembali ke Preview
        </button>

        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', fontSize: '15px', fontWeight: 600,
            color: 'white',
            background: copied ? 'rgba(37,211,102,0.8)' : '#25D366',
            border: 'none', borderRadius: '9999px', cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.3px',
            transition: 'opacity 0.15s, background 0.2s',
            boxShadow: 'rgba(37,211,102,0.3) 0px 0px 20px, rgba(255,255,255,0.15) 0px 1px 0px 0px inset',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {copied ? (
            '✓ Tersalin!'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Copy ke WhatsApp
            </>
          )}
        </button>
      </div>
    </div>
  );
}
