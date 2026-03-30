import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/tmp/pdf.worker.min.mjs';

const { parseBankStatement } = await import('./src/lib/bank-statement-parser.ts');

const buffer = fs.readFileSync('/tmp/test-statement.pdf');
const blob = new Blob([buffer], { type: 'application/pdf' });
const file = new File([blob], 'test.pdf', { type: 'application/pdf' });

const result = await parseBankStatement(file);

console.log(`Bank: ${result.bankName}, Currency: ${result.currency}, Detected: ${result.detectedAccount}`);
console.log(`Opening: ${result.statementOpeningBalance}, Closing: ${result.statementClosingBalance}`);
console.log(`Total: ${result.transactions.length}\n`);

result.transactions.forEach((tx, i) => {
  console.log(`[${i+1}] ${tx.date} | ${tx.amount >= 0 ? '+' : ''}${tx.amount.toLocaleString()} | Ref: ${tx.referenceNo || '-'}`);
  console.log(`    Desc: ${tx.description}`);
});
