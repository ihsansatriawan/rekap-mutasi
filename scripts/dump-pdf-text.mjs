import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/dump-pdf-text.mjs <path-to-pdf>');
    process.exit(1);
  }

  // Try to load pdfjs-dist
  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    pdfjs = await import('pdfjs-dist');
  }

  const data = new Uint8Array(readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

  console.log(`Total pages: ${doc.numPages}\n`);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    console.log(`\n=== PAGE ${i} ===\n`);
    for (const item of content.items) {
      if (item.str && item.str.trim()) {
        const [,,,, x, y] = item.transform;
        console.log(`[x:${x.toFixed(0)} y:${y.toFixed(0)}] "${item.str}"`);
      }
    }
  }
}

main().catch(console.error);
