# RecapMutasi — Design Spec

## Overview

A static web-based platform that converts Bank Jago PDF bank statements into structured financial reports, ready to copy to WhatsApp. Built for community fund managers (DKM, RT/RW, social organizations) who need transparency in communal finances.

## Core Decisions

- **Input format:** PDF (Bank Jago only for MVP)
- **Processing:** Fully client-side — no data leaves the browser
- **Categorization:** Rule-based with user preview/edit before generating report
- **Output:** WhatsApp-ready summary text (copy to clipboard)
- **Dashboard:** Local-only visualization (charts in browser), no sharing/backend
- **Architecture:** Next.js static SPA (`output: export`), deployed as static site
- **Backend:** None for MVP. Optional later for persistence/sharing features.

## Application Flow

Linear 4-step flow managed by page-level state:

```
Upload PDF → Parse & Extract → Preview & Kategorisasi → Generate Laporan
```

States: `'upload' → 'parsing' → 'preview' → 'result'`

## Components

### UploadZone

Drag-and-drop or file picker for PDF files. Validates file type (PDF only) and reasonable file size. Triggers parsing on file selection.

### ParserEngine (non-UI)

Modular PDF parsing pipeline:

1. **Extract** — `pdfjs-dist` extracts text content per page
2. **Normalize** — Combine text items by Y-position into rows, handle multi-page
3. **Parse rows** — Regex pattern matching to identify transaction rows vs headers/footers
4. **Structure** — Each transaction becomes a typed object

```typescript
interface Transaction {
  date: string;        // "2024-03-15"
  description: string; // "QRIS Payment - Warung Makan Pak Ahmad"
  amount: number;      // always positive
  type: 'debit' | 'credit';
  balance: number;     // balance after transaction
  category: string;    // assigned by categorizer
}

interface BankParser {
  detect(text: string): boolean;  // auto-detect bank from content
  parse(text: string): Transaction[];
}
```

Parser is modular — `parsers/bankJago.ts` implements `BankParser` interface. Adding new banks later means adding a new parser file. Exact parsing patterns will be finalized after inspecting the sample PDF.

### TransactionPreview

Table showing all parsed transactions with auto-assigned categories. Each row has a dropdown to change category. User can also add custom categories via an input field in the dropdown ("Tambah kategori..."). User validates here before proceeding to report generation.

### ReportResult

Displays:
- 3 summary cards: Total Pemasukan (green), Total Pengeluaran (red), Saldo Akhir (blue)
- Pie chart: breakdown pengeluaran per kategori
- Bar chart: pemasukan vs pengeluaran
- "Copy ke WhatsApp" button

## Categorization

### Default Categories

| Category | Keywords |
|----------|----------|
| Infaq/Donasi | infaq, donasi, sumbangan, transfer masuk |
| Operasional | listrik, air, PLN, PDAM |
| Konsumsi | makan, catering, snack, warung |
| Perbaikan/Maintenance | renovasi, perbaikan, tukang, material |
| Kegiatan | acara, pengajian, event |
| Transfer | transfer, tf |
| Lainnya | (default fallback) |

### Mechanism

- Case-insensitive keyword matching against transaction description
- Rules checked in order, first match wins
- User can override any category per transaction in the preview step
- User can add new custom categories from the dropdown
- Rules stored as config in code (no user-editable rules UI for MVP)

## WhatsApp Report Format

```
📊 *Laporan Keuangan*
📅 Periode: 1 - 31 Maret 2024
🏦 Bank Jago

💰 *Pemasukan:* Rp 5.250.000
💸 *Pengeluaran:* Rp 3.180.000
🏦 *Saldo Akhir:* Rp 2.070.000

📋 *Ringkasan Pengeluaran:*
• Operasional: Rp 1.200.000
• Konsumsi: Rp 850.000
• Perbaikan: Rp 730.000
• Kegiatan: Rp 400.000

✅ Laporan dibuat via RecapMutasi
```

- Copy to clipboard via `navigator.clipboard.writeText()`
- WhatsApp bold formatting with `*text*`
- Period auto-detected from first and last transaction dates
- Includes per-category expense breakdown for transparency

## Dashboard Visualization

Three visualizations on the result page using Recharts:

1. **Pie Chart** — Expense breakdown by category (proportional)
2. **Bar Chart** — Total income vs total expenses
3. **Summary Cards** — Total Pemasukan, Total Pengeluaran, Saldo Akhir

All displayed on the same page as the copy button. No multi-page navigation.

## Project Structure

```
recap-mutasi/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing + Upload, state machine
│   │   └── layout.tsx
│   ├── components/
│   │   ├── UploadZone.tsx
│   │   ├── TransactionPreview.tsx
│   │   ├── ReportResult.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── types.ts
│   │   │   └── bankJago.ts
│   │   ├── categorizer.ts
│   │   └── reportFormatter.ts
│   └── constants/
│       └── categories.ts
├── public/
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Dependencies

- `next` + `react` — framework
- `pdfjs-dist` — client-side PDF text extraction
- `recharts` — charts
- `tailwindcss` — styling

## State Management

`useState` at page level. Data passed to components via props. No context or state library needed at this scale.

## Future Considerations (not in MVP)

- Additional bank parsers (BCA, Mandiri, BRI, etc.)
- AI-powered categorization upgrade
- LocalStorage/IndexedDB for session persistence
- Optional backend for sharing dashboard via link
- User-editable categorization rules UI
