import type { Transaction } from '@/lib/parsers/types';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

function formatRupiah(amount: number): string {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

export function formatWhatsAppReport(transactions: Transaction[]): string {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = formatDate(sorted[0].date);
  const lastDate = formatDate(sorted[sorted.length - 1].date);

  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastTransaction = sorted[sorted.length - 1];
  const saldoAkhir = lastTransaction.balance;

  const expenseByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'debit') {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    }
  }

  const sortedCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a);

  const breakdownLines = sortedCategories
    .map(([cat, amount]) => `• ${cat}: ${formatRupiah(amount)}`)
    .join('\n');

  return `📊 *Laporan Keuangan*
📅 Periode: ${firstDate} - ${lastDate}
🏦 Bank Jago

💰 *Pemasukan:* ${formatRupiah(totalIncome)}
💸 *Pengeluaran:* ${formatRupiah(totalExpense)}
🏦 *Saldo Akhir:* ${formatRupiah(saldoAkhir)}

📋 *Ringkasan Pengeluaran:*
${breakdownLines}

✅ Laporan dibuat via RecapMutasi`;
}
