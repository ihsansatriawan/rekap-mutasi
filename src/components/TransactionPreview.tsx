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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Preview Transaksi</h2>
        <div className="text-sm text-gray-600">
          {transactions.length} transaksi | Masuk: {formatRupiah(totalIncome)} | Keluar: {formatRupiah(totalExpense)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Deskripsi</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Jumlah</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3">{t.description}</td>
                <td
                  className={`px-4 py-3 text-right whitespace-nowrap font-mono ${
                    t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {t.type === 'credit' ? '+' : '-'}{formatRupiah(t.amount)}
                </td>
                <td className="px-4 py-3">
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

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Upload ulang
        </button>
        <button
          onClick={() => onConfirm(transactions)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Generate Laporan →
        </button>
      </div>
    </div>
  );
}
