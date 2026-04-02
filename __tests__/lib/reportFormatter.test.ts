import { formatWhatsAppReport } from '@/lib/reportFormatter';
import type { Transaction } from '@/lib/parsers/types';

const sampleTransactions: Transaction[] = [
  { date: '2024-03-01', description: 'Donasi warga A', amount: 500000, type: 'credit', balance: 500000, category: 'Infaq/Donasi' },
  { date: '2024-03-05', description: 'Donasi warga B', amount: 300000, type: 'credit', balance: 800000, category: 'Infaq/Donasi' },
  { date: '2024-03-10', description: 'Bayar PLN', amount: 200000, type: 'debit', balance: 600000, category: 'Operasional' },
  { date: '2024-03-15', description: 'Beli snack rapat', amount: 50000, type: 'debit', balance: 550000, category: 'Konsumsi' },
  { date: '2024-03-20', description: 'Perbaikan atap', amount: 150000, type: 'debit', balance: 400000, category: 'Perbaikan/Maintenance' },
];

describe('formatWhatsAppReport', () => {
  it('includes header with period and bank name', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    expect(report).toContain('*Laporan Keuangan*');
    expect(report).toContain('Bank Jago');
    expect(report).toContain('1 Maret 2024');
    expect(report).toContain('20 Maret 2024');
  });

  it('calculates correct totals', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    expect(report).toContain('Rp 800.000');   // total income: 500k + 300k
    expect(report).toContain('Rp 400.000');   // total expense: 200k + 50k + 150k
  });

  it('includes saldo akhir from last transaction', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    expect(report).toContain('*Saldo Akhir:*');
    expect(report).toContain('Rp 400.000');
  });

  it('includes expense breakdown by category', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    expect(report).toContain('Operasional: Rp 200.000');
    expect(report).toContain('Perbaikan/Maintenance: Rp 150.000');
    expect(report).toContain('Konsumsi: Rp 50.000');
  });

  it('sorts expense categories by amount descending', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    const opIdx = report.indexOf('Operasional');
    const perbaikanIdx = report.indexOf('Perbaikan/Maintenance');
    const konsumsiIdx = report.indexOf('Konsumsi');
    expect(opIdx).toBeLessThan(perbaikanIdx);
    expect(perbaikanIdx).toBeLessThan(konsumsiIdx);
  });

  it('excludes income categories from expense breakdown', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    const breakdownSection = report.split('Ringkasan Pengeluaran')[1];
    expect(breakdownSection).not.toContain('Infaq/Donasi');
  });

  it('includes footer', () => {
    const report = formatWhatsAppReport(sampleTransactions);
    expect(report).toContain('RecapMutasi');
  });
});
