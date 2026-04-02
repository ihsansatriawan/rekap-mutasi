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

  // Sort rows top-to-bottom (higher y = higher on page in PDF coordinates)
  rows.sort((a, b) => b.y - a.y);
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

  return rows;
}

function parseAmount(str: string): number {
  // Remove + or - prefix, remove thousand separators (dots), convert decimal comma to dot
  // Examples: "-503.500" -> 503500, "+1.100.000" -> 1100000, "+500.000,00" -> 500000
  const cleaned = str.replace(/^[+-]/, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04',
  May: '05', Jun: '06', Jul: '07', Aug: '08',
  Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function parseDate(str: string): string | null {
  // Bank Jago uses "01 Mar 2026" format
  const match = str.match(/^(\d{2})\s+(\w{3})\s+(\d{4})$/);
  if (match) {
    const [, day, mon, year] = match;
    const month = MONTH_MAP[mon];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

function isTimeStr(str: string): boolean {
  return /^\d{2}:\d{2}$/.test(str);
}

function isAmountStr(str: string): boolean {
  // Amounts start with + or - followed by digits, dots, optional comma+digits
  return /^[+-][\d.,]+$/.test(str);
}

// Column x-position thresholds based on observed PDF structure:
// x~64:   Date / Time
// x~260:  Source/Destination (name + account)
// x~576:  Transaction Details (type + ID)
// x~1042: Notes
// x~1380-1460: Amount
// x~1643-1710: Balance

const COL_DATE = 64;
const COL_SOURCE = 260;
const COL_DETAILS = 576;
const COL_NOTES = 1042;
const COL_AMOUNT = 1380;
const COL_BALANCE = 1630;

function getColumn(x: number): 'date' | 'source' | 'details' | 'notes' | 'amount' | 'balance' | 'other' {
  if (x < 200) return 'date';
  if (x < 500) return 'source';
  if (x < 900) return 'details';
  if (x < 1350) return 'notes';
  if (x < 1620) return 'amount';
  return 'balance';
}

interface TransactionGroup {
  dateRow: RawRow;
  timeRow?: RawRow;
  dataRows: RawRow[];
}

function parseRows(rows: RawRow[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Identify transaction rows: rows where the first item at x~64 is a date string
  // Each transaction spans 2 rows (date row + time row) with data spread across columns

  // We'll group consecutive rows into transaction entries.
  // A new transaction starts when we see a date string in column 'date' (x < 200)

  // First, filter out header/footer rows and find transaction boundaries
  const transactionGroups: { dateY: number; rows: RawRow[] }[] = [];
  let currentGroup: { dateY: number; rows: RawRow[] } | null = null;

  for (const row of rows) {
    const firstItem = row.items[0];
    if (!firstItem) continue;

    // Check if this row starts a new transaction (has a date in date column)
    if (firstItem.x < 150 && parseDate(firstItem.text)) {
      // Start new group
      currentGroup = { dateY: row.y, rows: [row] };
      transactionGroups.push(currentGroup);
    } else if (currentGroup) {
      // Check if this row belongs to current transaction group
      // The time row (e.g. "14:32") follows immediately below date row
      // Data rows for the same transaction have y within ~200 units of dateY
      const yDiff = currentGroup.dateY - row.y;
      if (yDiff < 200) {
        currentGroup.rows.push(row);
      } else {
        // Too far away - don't attach
        currentGroup = null;
      }
    }
  }

  for (const group of transactionGroups) {
    // Collect all text items from the group's rows, organized by column
    const colDate: string[] = [];
    const colSource: string[] = [];
    const colDetails: string[] = [];
    const colNotes: string[] = [];
    const colAmount: string[] = [];
    const colBalance: string[] = [];

    for (const row of group.rows) {
      for (const item of row.items) {
        const col = getColumn(item.x);
        switch (col) {
          case 'date': colDate.push(item.text); break;
          case 'source': colSource.push(item.text); break;
          case 'details': colDetails.push(item.text); break;
          case 'notes': colNotes.push(item.text); break;
          case 'amount': colAmount.push(item.text); break;
          case 'balance': colBalance.push(item.text); break;
        }
      }
    }

    // Parse date (first item in date column that looks like a date)
    const dateStr = colDate.find((t) => parseDate(t) !== null);
    if (!dateStr) continue;
    const date = parseDate(dateStr);
    if (!date) continue;

    // Parse time (first item in date column that looks like HH:MM)
    const timeStr = colDate.find((t) => isTimeStr(t)) || '';

    // Parse amount: find the item that starts with + or -
    const amountRaw = colAmount.find((t) => isAmountStr(t)) || '';
    if (!amountRaw) continue;

    const amount = parseAmount(amountRaw);
    const type: 'debit' | 'credit' = amountRaw.startsWith('-') ? 'debit' : 'credit';

    // Parse balance: first item in balance column
    const balanceRaw = colBalance[0] || '0';
    const balance = parseAmount(balanceRaw);

    // Build description: source/destination name (first line of source column)
    // Combined with transaction details type (first line of details column)
    const sourceName = colSource[0] || '';
    const sourceAccount = colSource[1] || '';
    const detailType = colDetails[0] || '';

    let description = detailType;
    if (sourceName && sourceName !== detailType) {
      description = `${detailType} - ${sourceName}`;
      if (sourceAccount) {
        description += ` (${sourceAccount})`;
      }
    }

    // Notes
    const notes = colNotes.join(' ').trim();

    transactions.push({
      date,
      description,
      amount,
      type,
      balance,
      category: '',
    });
  }

  return transactions;
}

export const bankJagoParser: BankParser = {
  detect(text: string): boolean {
    return (
      text.toLowerCase().includes('bank jago') ||
      text.toLowerCase().includes('jago') ||
      text.toLowerCase().includes('pt bank jago')
    );
  },

  parse(pages: string[]): Transaction[] {
    const allRows: RawRow[] = [];
    for (const pageJson of pages) {
      const items: TextItem[] = JSON.parse(pageJson);
      allRows.push(...groupByRow(items));
    }
    return parseRows(allRows);
  },
};

export async function parsePdf(file: File): Promise<Transaction[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(JSON.stringify(content.items));
  }

  const result = bankJagoParser.parse(pages);

  if (result.length === 0) {
    throw new Error(
      'Tidak ada transaksi ditemukan. Pastikan file adalah mutasi Bank Jago yang valid.'
    );
  }

  return result;
}
