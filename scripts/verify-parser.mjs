import { readFileSync } from 'fs';

const MONTH_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04',
  May: '05', Jun: '06', Jul: '07', Aug: '08',
  Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function groupByRow(items, tolerance = 3) {
  const rows = [];
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

function parseAmount(str) {
  const cleaned = str.replace(/^[+-]/, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDate(str) {
  const match = str.match(/^(\d{2})\s+(\w{3})\s+(\d{4})$/);
  if (match) {
    const [, day, mon, year] = match;
    const month = MONTH_MAP[mon];
    if (month) return `${year}-${month}-${day}`;
  }
  return null;
}

function isTimeStr(str) {
  return /^\d{2}:\d{2}$/.test(str);
}

function isAmountStr(str) {
  return /^[+-][\d.,]+$/.test(str);
}

function getColumn(x) {
  if (x < 200) return 'date';
  if (x < 500) return 'source';
  if (x < 900) return 'details';
  if (x < 1350) return 'notes';
  if (x < 1620) return 'amount';
  return 'balance';
}

function parseRows(rows) {
  const transactions = [];
  const transactionGroups = [];
  let currentGroup = null;

  for (const row of rows) {
    const firstItem = row.items[0];
    if (!firstItem) continue;

    if (firstItem.x < 150 && parseDate(firstItem.text)) {
      currentGroup = { dateY: row.y, rows: [row] };
      transactionGroups.push(currentGroup);
    } else if (currentGroup) {
      const yDiff = currentGroup.dateY - row.y;
      if (yDiff < 200) {
        currentGroup.rows.push(row);
      } else {
        currentGroup = null;
      }
    }
  }

  for (const group of transactionGroups) {
    const colDate = [];
    const colSource = [];
    const colDetails = [];
    const colNotes = [];
    const colAmount = [];
    const colBalance = [];

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

    const dateStr = colDate.find((t) => parseDate(t) !== null);
    if (!dateStr) continue;
    const date = parseDate(dateStr);
    if (!date) continue;

    const amountRaw = colAmount.find((t) => isAmountStr(t)) || '';
    if (!amountRaw) continue;

    const amount = parseAmount(amountRaw);
    const type = amountRaw.startsWith('-') ? 'debit' : 'credit';

    const balanceRaw = colBalance[0] || '0';
    const balance = parseAmount(balanceRaw);

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

    transactions.push({ date, description, amount, type, balance, category: '' });
  }

  return transactions;
}

async function main() {
  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    pdfjs = await import('pdfjs-dist');
  }

  const filePath = process.argv[2] || 'sample-bank-jago.pdf.pdf';
  const data = new Uint8Array(readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(JSON.stringify(content.items));
  }

  const allRows = [];
  for (const pageJson of pages) {
    const items = JSON.parse(pageJson);
    allRows.push(...groupByRow(items));
  }

  const transactions = parseRows(allRows);

  console.log(`\nTotal transactions parsed: ${transactions.length}\n`);
  console.log('=== PARSED TRANSACTIONS ===\n');
  transactions.forEach((t, i) => {
    const sign = t.type === 'debit' ? '-' : '+';
    console.log(`[${i + 1}] ${t.date} | ${t.type.toUpperCase()} | ${sign}${t.amount.toLocaleString()} | Balance: ${t.balance.toLocaleString()}`);
    console.log(`     Desc: ${t.description}`);
  });
}

main().catch(console.error);
