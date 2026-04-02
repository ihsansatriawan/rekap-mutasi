import { categorize, categorizeAll } from '@/lib/categorizer';
import type { Transaction } from '@/lib/parsers/types';

describe('categorize', () => {
  it('matches keyword case-insensitively', () => {
    expect(categorize('Pembayaran PLN Token')).toBe('Operasional');
  });

  it('returns first matching category (priority order)', () => {
    expect(categorize('Transfer donasi bulanan')).toBe('Infaq/Donasi');
  });

  it('returns Lainnya when no keyword matches', () => {
    expect(categorize('ABCXYZ unknown transaction')).toBe('Lainnya');
  });

  it('matches partial words in description', () => {
    expect(categorize('Beli snack rapat')).toBe('Konsumsi');
  });
});

describe('categorizeAll', () => {
  it('assigns categories to all transactions', () => {
    const transactions: Transaction[] = [
      { date: '2024-03-01', description: 'Donasi warga', amount: 100000, type: 'credit', balance: 100000, category: '' },
      { date: '2024-03-02', description: 'Bayar PLN', amount: 50000, type: 'debit', balance: 50000, category: '' },
      { date: '2024-03-03', description: 'Something random', amount: 10000, type: 'debit', balance: 40000, category: '' },
    ];

    const result = categorizeAll(transactions);

    expect(result[0].category).toBe('Infaq/Donasi');
    expect(result[1].category).toBe('Operasional');
    expect(result[2].category).toBe('Lainnya');
  });

  it('does not mutate original transactions', () => {
    const original: Transaction[] = [
      { date: '2024-03-01', description: 'Donasi', amount: 100000, type: 'credit', balance: 100000, category: '' },
    ];

    const result = categorizeAll(original);

    expect(result).not.toBe(original);
    expect(original[0].category).toBe('');
  });
});
