# RecapMutasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static web app that converts Bank Jago PDF statements into WhatsApp-ready financial reports with auto-categorization and local dashboard visualization.

**Architecture:** Next.js static SPA (`output: export`) with all processing client-side. PDF parsed via `pdfjs-dist`, transactions categorized by keyword rules with user preview/edit, output formatted for WhatsApp clipboard copy. Recharts for visualization.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, pdfjs-dist, Recharts

---

## File Map

```
recap-mutasi/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main page with state machine (upload→parsing→preview→result)
│   │   ├── layout.tsx                  # Root layout with metadata
│   │   └── globals.css                 # Tailwind imports + custom styles
│   ├── components/
│   │   ├── UploadZone.tsx              # Drag-drop + file picker for PDF
│   │   ├── TransactionPreview.tsx      # Table with category dropdowns
│   │   ├── ReportResult.tsx            # Summary cards + charts + copy button
│   │   └── ui/
│   │       └── CategoryDropdown.tsx    # Reusable dropdown with "add custom" option
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── types.ts               # Transaction, BankParser interfaces
│   │   │   └── bankJago.ts            # Bank Jago PDF parser
│   │   ├── categorizer.ts             # Rule-based categorization engine
│   │   └── reportFormatter.ts         # WhatsApp text formatter
│   └── constants/
│       └── categories.ts              # Default categories & keyword rules
├── __tests__/
│   ├── lib/
│   │   ├── categorizer.test.ts
│   │   └── reportFormatter.test.ts
│   └── components/
│       └── TransactionPreview.test.tsx
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── jest.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `jest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This creates the full scaffolding including `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`.

- [ ] **Step 2: Configure static export**

In `next.config.js`, set output to export:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

- [ ] **Step 3: Install additional dependencies**

Run:
```bash
npm install pdfjs-dist recharts
npm install -D jest @jest/globals ts-jest @testing-library/react @testing-library/jest-dom @types/jest jest-environment-jsdom
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(config);
```

- [ ] **Step 5: Replace default page with shell**

Replace `src/app/page.tsx` with:

```tsx
'use client';

import { useState } from 'react';

type AppState = 'upload' | 'parsing' | 'preview' | 'result';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">RecapMutasi</h1>
        <p className="text-center text-gray-600 mb-8">
          Konversi mutasi bank PDF menjadi laporan keuangan siap WhatsApp
        </p>
        {state === 'upload' && <p className="text-center">Upload zone placeholder</p>}
        {state === 'parsing' && <p className="text-center">Parsing...</p>}
        {state === 'preview' && <p className="text-center">Preview placeholder</p>}
        {state === 'result' && <p className="text-center">Result placeholder</p>}
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Update layout metadata**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RecapMutasi — Laporan Keuangan dari Mutasi Bank',
  description: 'Konversi PDF mutasi bank menjadi laporan keuangan terstruktur siap WhatsApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Verify app runs**

Run:
```bash
npm run dev
```

Expected: App starts on localhost:3000, shows "RecapMutasi" heading with "Upload zone placeholder" text.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with static export, Tailwind, Jest"
```

---

### Task 2: Types & Constants

**Files:**
- Create: `src/lib/parsers/types.ts`, `src/constants/categories.ts`

- [ ] **Step 1: Define core types**

Create `src/lib/parsers/types.ts`:

```typescript
export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  category: string;
}

export interface BankParser {
  detect(text: string): boolean;
  parse(pages: string[]): Transaction[];
}

export interface CategoryRule {
  category: string;
  keywords: string[];
}
```

- [ ] **Step 2: Define default categories**

Create `src/constants/categories.ts`:

```typescript
import { CategoryRule } from '@/lib/parsers/types';

export const DEFAULT_CATEGORIES: CategoryRule[] = [
  { category: 'Infaq/Donasi', keywords: ['infaq', 'donasi', 'sumbangan', 'sedekah', 'zakat'] },
  { category: 'Operasional', keywords: ['listrik', 'air', 'pln', 'pdam', 'wifi', 'internet', 'pulsa'] },
  { category: 'Konsumsi', keywords: ['makan', 'catering', 'snack', 'warung', 'resto', 'kopi'] },
  { category: 'Perbaikan/Maintenance', keywords: ['renovasi', 'perbaikan', 'tukang', 'material', 'cat', 'bangunan'] },
  { category: 'Kegiatan', keywords: ['acara', 'pengajian', 'event', 'kegiatan', 'rapat'] },
  { category: 'Transfer', keywords: ['transfer', 'tf'] },
];

export const FALLBACK_CATEGORY = 'Lainnya';

export const ALL_CATEGORIES = [
  ...DEFAULT_CATEGORIES.map((r) => r.category),
  FALLBACK_CATEGORY,
];
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/parsers/types.ts src/constants/categories.ts
git commit -m "feat: add Transaction types and default category rules"
```

---

### Task 3: Categorizer

**Files:**
- Create: `src/lib/categorizer.ts`, `__tests__/lib/categorizer.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/categorizer.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx jest __tests__/lib/categorizer.test.ts --verbose
```

Expected: FAIL — module `@/lib/categorizer` not found.

- [ ] **Step 3: Implement categorizer**

Create `src/lib/categorizer.ts`:

```typescript
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '@/constants/categories';
import type { Transaction } from '@/lib/parsers/types';

export function categorize(description: string): string {
  const lower = description.toLowerCase();

  for (const rule of DEFAULT_CATEGORIES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return FALLBACK_CATEGORY;
}

export function categorizeAll(transactions: Transaction[]): Transaction[] {
  return transactions.map((t) => ({
    ...t,
    category: categorize(t.description),
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx jest __tests__/lib/categorizer.test.ts --verbose
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/categorizer.ts __tests__/lib/categorizer.test.ts
git commit -m "feat: add rule-based transaction categorizer with tests"
```

---

### Task 4: Report Formatter

**Files:**
- Create: `src/lib/reportFormatter.ts`, `__tests__/lib/reportFormatter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/reportFormatter.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx jest __tests__/lib/reportFormatter.test.ts --verbose
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement report formatter**

Create `src/lib/reportFormatter.ts`:

```typescript
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
  return `Rp ${amount.toLocaleString('id-ID')}`;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx jest __tests__/lib/reportFormatter.test.ts --verbose
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reportFormatter.ts __tests__/lib/reportFormatter.test.ts
git commit -m "feat: add WhatsApp report formatter with tests"
```

---

### Task 5: Bank Jago PDF Parser

**Files:**
- Create: `src/lib/parsers/bankJago.ts`

**Note:** This task requires a sample Bank Jago PDF to be placed at the project root (e.g. `sample-bank-jago.pdf`). The parsing regex patterns below are a starting framework — they must be adjusted after inspecting the actual PDF structure. The engineer should:
1. Place the sample PDF in the project
2. Write a quick script to dump raw text from the PDF using `pdfjs-dist`
3. Study the text structure (column positions, date formats, number formats)
4. Adjust the regex patterns accordingly

- [ ] **Step 1: Create a PDF text extraction script**

Create `scripts/dump-pdf-text.ts` (temporary, for development only):

```typescript
import * as fs from 'fs';
import * as pdfjs from 'pdfjs-dist';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx ts-node scripts/dump-pdf-text.ts <path-to-pdf>');
    process.exit(1);
  }

  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data }).promise;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    console.log(`\n=== PAGE ${i} ===\n`);
    const items = content.items as Array<{ str: string; transform: number[] }>;
    for (const item of items) {
      const [, , , , x, y] = item.transform;
      console.log(`[x:${x.toFixed(0)} y:${y.toFixed(0)}] "${item.str}"`);
    }
  }
}

main();
```

- [ ] **Step 2: Run the script against sample PDF**

Run:
```bash
npx ts-node scripts/dump-pdf-text.ts sample-bank-jago.pdf
```

Study the output to understand: date format, column positions (description, debit, credit, balance), header/footer patterns.

- [ ] **Step 3: Implement the Bank Jago parser**

Create `src/lib/parsers/bankJago.ts`:

```typescript
import type { BankParser, Transaction } from './types';

interface TextItem {
  str: string;
  transform: number[];
}

interface RawRow {
  y: number;
  items: { x: number; text: string }[];
}

function groupByRow(items: TextItem[], tolerance: number = 3): RawRow[] {
  const rows: RawRow[] = [];

  for (const item of items) {
    const [, , , , x, y] = item.transform;
    const text = item.str.trim();
    if (!text) continue;

    const existing = rows.find((r) => Math.abs(r.y - y) < tolerance);
    if (existing) {
      existing.items.push({ x, text });
    } else {
      rows.push({ y, items: [{ x, text }] });
    }
  }

  rows.sort((a, b) => b.y - a.y);
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

  return rows;
}

function parseAmount(str: string): number {
  return parseFloat(str.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
}

function parseDate(str: string): string | null {
  // Adjust this regex after inspecting the sample PDF
  // Common formats: "01/03/2024", "01 Mar 2024", "2024-03-01"
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
}

export const bankJagoParser: BankParser = {
  detect(text: string): boolean {
    return text.toLowerCase().includes('bank jago') || text.toLowerCase().includes('jago');
  },

  parse(pages: string[]): Transaction[] {
    // This is a placeholder structure. After running dump-pdf-text.ts
    // against the sample PDF, replace this with actual parsing logic
    // that matches the Bank Jago statement format.
    //
    // The engineer MUST:
    // 1. Run dump-pdf-text.ts to see the raw text layout
    // 2. Identify date, description, amount, and balance column positions
    // 3. Write regex/position-based parsing for the specific format
    // 4. Test against the sample PDF
    throw new Error(
      'Bank Jago parser not yet calibrated. Run scripts/dump-pdf-text.ts against the sample PDF first, then implement parsing logic based on the actual text layout.'
    );
  },
};
```

- [ ] **Step 4: Calibrate parser against sample PDF**

After studying the dump output from Step 2:
1. Update the `parseDate` function to match the actual date format
2. Implement the `parse` method to extract transactions from the grouped rows
3. Identify which column positions correspond to date, description, debit, credit, balance

The implementation depends entirely on what the PDF text dump reveals. The `groupByRow` helper and `parseAmount`/`parseDate` utilities are ready to use.

- [ ] **Step 5: Manual verification**

Create a quick test script or add a console log in the app to verify parsing output against known values from the sample statement.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parsers/bankJago.ts scripts/dump-pdf-text.ts
git commit -m "feat: add Bank Jago PDF parser with text extraction utility"
```

---

### Task 6: UploadZone Component

**Files:**
- Create: `src/components/UploadZone.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create UploadZone component**

Create `src/components/UploadZone.tsx`:

```tsx
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
        id="pdf-upload"
      />
      <label htmlFor="pdf-upload" className="cursor-pointer">
        <div className="text-4xl mb-4">📄</div>
        <p className="text-lg font-medium text-gray-700">
          Drag & drop file PDF mutasi bank di sini
        </p>
        <p className="text-sm text-gray-500 mt-2">
          atau klik untuk pilih file (maks. 10MB)
        </p>
      </label>
      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire UploadZone into page**

Replace `src/app/page.tsx` with:

```tsx
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
```

Note: This references `parsePdf` which will be a wrapper export from `bankJago.ts`. The engineer should add this export to `bankJago.ts` after calibrating the parser in Task 5:

```typescript
export async function parsePdf(file: File): Promise<Transaction[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Collect raw text items for the parser
    pages.push(JSON.stringify(content.items));
  }

  return bankJagoParser.parse(pages);
}
```

- [ ] **Step 3: Verify upload UI works visually**

Run:
```bash
npm run dev
```

Expected: Upload zone renders with drag-drop area. Selecting a non-PDF shows error. Selecting a PDF triggers parsing state (will error since parser isn't calibrated yet — that's fine).

- [ ] **Step 4: Commit**

```bash
git add src/components/UploadZone.tsx src/app/page.tsx
git commit -m "feat: add UploadZone component with drag-drop and file validation"
```

---

### Task 7: CategoryDropdown Component

**Files:**
- Create: `src/components/ui/CategoryDropdown.tsx`

- [ ] **Step 1: Create CategoryDropdown component**

Create `src/components/ui/CategoryDropdown.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ALL_CATEGORIES } from '@/constants/categories';

interface CategoryDropdownProps {
  value: string;
  onChange: (category: string) => void;
  customCategories: string[];
  onAddCategory: (category: string) => void;
}

export function CategoryDropdown({
  value,
  onChange,
  customCategories,
  onAddCategory,
}: CategoryDropdownProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const allOptions = [...ALL_CATEGORIES, ...customCategories];

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !allOptions.includes(trimmed)) {
      onAddCategory(trimmed);
      onChange(trimmed);
    }
    setNewCategory('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="flex gap-1">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
            if (e.key === 'Escape') setIsAdding(false);
          }}
          placeholder="Nama kategori..."
          className="border rounded px-2 py-1 text-sm w-32"
          autoFocus
        />
        <button
          onClick={handleAdd}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === '__add__') {
          setIsAdding(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="border rounded px-2 py-1 text-sm bg-white"
    >
      {allOptions.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
      <option value="__add__">+ Tambah kategori...</option>
    </select>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/CategoryDropdown.tsx
git commit -m "feat: add CategoryDropdown with custom category support"
```

---

### Task 8: TransactionPreview Component

**Files:**
- Create: `src/components/TransactionPreview.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create TransactionPreview component**

Create `src/components/TransactionPreview.tsx`:

```tsx
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
  return `Rp ${amount.toLocaleString('id-ID')}`;
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
```

- [ ] **Step 2: Wire TransactionPreview into page**

In `src/app/page.tsx`, add the import and replace the preview placeholder:

Add import at top:
```tsx
import { TransactionPreview } from '@/components/TransactionPreview';
```

Replace the preview placeholder block:
```tsx
{state === 'preview' && (
  <p className="text-center">Preview placeholder — {transactions.length} transaksi</p>
)}
```

With:
```tsx
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
```

- [ ] **Step 3: Verify visually**

Run `npm run dev`. You won't see the preview naturally yet (parser not calibrated), but you can temporarily hardcode test transactions in `page.tsx` to verify the table renders:

Temporarily set initial state to `'preview'` and provide mock transactions to verify rendering. Revert after verification.

- [ ] **Step 4: Commit**

```bash
git add src/components/TransactionPreview.tsx src/app/page.tsx
git commit -m "feat: add TransactionPreview with category editing"
```

---

### Task 9: ReportResult Component

**Files:**
- Create: `src/components/ReportResult.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create ReportResult component**

Create `src/components/ReportResult.tsx`:

```tsx
'use client';

import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Transaction } from '@/lib/parsers/types';
import { formatWhatsAppReport } from '@/lib/reportFormatter';

interface ReportResultProps {
  transactions: Transaction[];
  onBack: () => void;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
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
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatRupiah(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Pemasukan vs Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(value: number) => formatRupiah(value)} />
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
```

- [ ] **Step 2: Wire ReportResult into page**

In `src/app/page.tsx`, add the import:

```tsx
import { ReportResult } from '@/components/ReportResult';
```

Replace the result placeholder block:
```tsx
{state === 'result' && (
  <p className="text-center">Result placeholder</p>
)}
```

With:
```tsx
{state === 'result' && (
  <ReportResult
    transactions={transactions}
    onBack={() => setState('preview')}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ReportResult.tsx src/app/page.tsx
git commit -m "feat: add ReportResult with charts and WhatsApp copy"
```

---

### Task 10: PDF.js Worker Configuration & Integration Test

**Files:**
- Modify: `src/lib/parsers/bankJago.ts`, `next.config.js`

- [ ] **Step 1: Configure PDF.js worker for Next.js**

Update `next.config.js` to copy the worker file:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
```

- [ ] **Step 2: Update parsePdf to set worker source**

In `src/lib/parsers/bankJago.ts`, ensure the `parsePdf` export sets the worker source correctly for client-side usage:

```typescript
export async function parsePdf(file: File): Promise<Transaction[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const allItems: TextItem[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    allItems.push(...(content.items as TextItem[]));
  }

  const rows = groupByRow(allItems);
  return parseRows(rows);  // parseRows is the calibrated parsing function from Task 5
}
```

The exact implementation of `parseRows` depends on the sample PDF structure discovered in Task 5.

- [ ] **Step 3: End-to-end manual test**

Run `npm run dev`, upload the sample Bank Jago PDF, verify:
1. PDF is parsed without errors
2. Transactions appear in the preview table with auto-categories
3. Categories can be edited
4. "Generate Laporan" shows charts and summary
5. "Copy ke WhatsApp" copies formatted text to clipboard

- [ ] **Step 4: Verify static export builds**

Run:
```bash
npm run build
```

Expected: Build succeeds with `output: export`, producing static files in `out/` directory.

- [ ] **Step 5: Commit**

```bash
git add next.config.js src/lib/parsers/bankJago.ts
git commit -m "feat: configure PDF.js worker and finalize integration"
```
