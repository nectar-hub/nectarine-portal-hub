import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/tmp/pdf.worker.min.mjs';

const buffer = fs.readFileSync('/tmp/test-statement.pdf');
const blob = new Blob([buffer], { type: 'application/pdf' });
const file = new File([blob], 'test.pdf', { type: 'application/pdf' });

const ab = await file.arrayBuffer();
const pdf = await pdfjsLib.getDocument({ data: ab }).promise;

// Dump page 2 raw items to understand coordinate system
for (let p = 2; p <= 2; p++) {
  const page = await pdf.getPage(p);
  const tc = await page.getTextContent();
  console.log(`=== PAGE ${p} (${tc.items.length} items) ===`);
  for (const item of tc.items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const x = Math.round(item.transform[4]);
    const y = Math.round(item.transform[5]);
    console.log(`  x=${x} y=${y} "${item.str.trim()}"`);
  }
}
