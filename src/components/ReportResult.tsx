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
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
];

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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Laporan Keuangan</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 font-medium">Total Pemasukan</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600 font-medium">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 font-medium">Saldo Akhir</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatRupiah(saldoAkhir)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Breakdown Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatRupiah(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Pemasukan vs Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(value) => formatRupiah(value as number)} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Copy Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Kembali ke Preview
        </button>
        <button
          onClick={handleCopy}
          className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
            copied
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {copied ? '✓ Tersalin!' : '📋 Copy ke WhatsApp'}
        </button>
      </div>
    </div>
  );
}
