import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/tmp/pdf.worker.min.mjs';

const LINE_TOLERANCE = 6;
const DATE_PATTERN = /^(\d{2})[./](\d{2})[./](\d{4})$/;
const DATE_INLINE_PATTERN = /(\d{2}[./]\d{2}[./]\d{4})/;
const TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/;
const AMOUNT_PATTERN = /^[\d,]+\.\d{2}$/;

function detectPaymentAccount(bankName, currency) {
  const bank = bankName.toUpperCase();
  if (bank.includes('CRDB') || bank.includes('CROB')) return currency.toUpperCase() === 'USD' ? 'CRDB_USD' : 'CRDB';
  if (bank.includes('NMB')) return 'NMB_CARD';
  return 'CASH';
}
function parseAmount(str) { const v = parseFloat(str.replace(/,/g, '')); return Number.isFinite(v) ? v : 0; }
function parseDate(dateStr) { const m = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; }
function normalizeWhitespace(v) { return v.replace(/\s+/g, ' ').trim(); }
function extractReferenceNo(v) { const m = v.match(/\bREF:\s*([a-fA-F0-9]+)\b/i); return m ? `REF:${m[1]}` : null; }
function cleanDescription(value) {
  return normalizeWhitespace(value.replace(/^details\s*/i, '').replace(/\bvalue date\b/gi, ' ').replace(/\bbook balance\b/gi, ' ')).substring(0, 200) || 'Transaction';
}
function extractSummaryAmount(lineText, label) { const m = lineText.match(label); return m ? parseAmount(m[1]) : null; }
function detectRotation(items) {
  const d = items.find(i => i.text.toLowerCase() === 'debit');
  const c = items.find(i => i.text.toLowerCase() === 'credit');
  if (!d || !c) return false;
  return Math.abs(d.x - c.x) < 20 && Math.abs(d.y - c.y) > 50;
}
function isHeaderOrSummaryLine(lt) {
  return /transaction summary|posting date|book balance|available balance|summary of|total value for|account bank statement|^page\s+\d/i.test(lt);
}

async function extractTextItems(file) {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  const raw = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    for (const item of tc.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      raw.push({ page: p, x: Math.round(item.transform[4]), y: Math.round(item.transform[5]), text: item.str.trim() });
    }
  }
  const rot = detectRotation(raw);
  return raw.map(i => ({ page: i.page, row: rot ? i.x : i.y, col: rot ? i.y : i.x, text: i.text }));
}

function groupItemsByLine(items) {
  const lines = [];
  const byPage = new Map();
  for (const item of items) { if (!byPage.has(item.page)) byPage.set(item.page, []); byPage.get(item.page).push(item); }
  for (const [page, pageItems] of [...byPage.entries()].sort((a,b) => a[0]-b[0])) {
    const lineMap = new Map();
    for (const item of pageItems) {
      let matched = null;
      for (const r of lineMap.keys()) { if (Math.abs(r - item.row) <= LINE_TOLERANCE) { matched = r; break; } }
      const rk = matched ?? item.row;
      if (!lineMap.has(rk)) lineMap.set(rk, []);
      lineMap.get(rk).push(item);
    }
    for (const [row, li] of [...lineMap.entries()].sort((a,b) => b[0]-a[0])) {
      lines.push({ page, row, items: li.sort((a,b) => a.col - b.col) });
    }
  }
  return lines;
}

function findColumnHeaders(items, lines) {
  for (const line of lines) {
    const texts = line.items.map(i => i.text.toLowerCase());
    if (texts.includes('debit') && texts.includes('credit')) {
      const d = line.items.find(i => i.text.toLowerCase() === 'debit');
      const c = line.items.find(i => i.text.toLowerCase() === 'credit');
      if (d && c) return { debitCol: d.col, creditCol: c.col };
    }
  }
  const d = items.find(i => i.text.toLowerCase() === 'debit');
  const c = items.find(i => i.text.toLowerCase() === 'credit');
  if (d && c) return { debitCol: d.col, creditCol: c.col };
  return null;
}

function classifyAmountColumn(ic, cols) {
  const dd = Math.abs(ic - cols.debitCol), cd = Math.abs(ic - cols.creditCol), tol = 110;
  if (dd <= tol && dd < cd) return 'debit'; if (cd <= tol && cd < dd) return 'credit';
  if (dd <= tol) return 'debit'; if (cd <= tol) return 'credit'; return 'other';
}

function extractDateFromLine(items) {
  for (const item of items) {
    if (DATE_PATTERN.test(item.text)) return parseDate(item.text);
    const im = item.text.match(DATE_INLINE_PATTERN);
    if (im) return parseDate(im[1]);
  }
  return null;
}

// Main
const buffer = fs.readFileSync('/tmp/test-statement.pdf');
const blob = new Blob([buffer], { type: 'application/pdf' });
const file = new File([blob], 'test.pdf', { type: 'application/pdf' });

const items = await extractTextItems(file);
const lines = groupItemsByLine(items);

let bankName = 'CRDB', accountNumber = '', currency = 'TZS';
let statementClosingBalance = null, totalCredits = null, totalDebits = null;

for (const line of lines.slice(0, 40)) {
  const lt = line.items.map(i => i.text).join(' ');
  if (/CRDB|CROB/i.test(lt)) bankName = 'CRDB';
  if (/\bNMB\b/i.test(lt) && !/TRANSFER|FT|TO|FROM/i.test(lt)) bankName = 'NMB';
  const am = lt.match(/Account\s*:?\s*(\d+)/i);
  if (am) accountNumber = am[1];
  if (/\bUSD\b/i.test(lt)) currency = 'USD';
  if (/\bTZS\b/i.test(lt)) currency = 'TZS';
  statementClosingBalance ??= extractSummaryAmount(lt, /Available Balance\s*:?\s*([\d,]+\.\d{2})/i) ?? extractSummaryAmount(lt, /Summary of Book Balance(?:\s+as\s+at\s+[^:]+)?\s*:?\s*([\d,]+\.\d{2})/i);
  totalCredits ??= extractSummaryAmount(lt, /Total Value for Credit\s*:?\s*([\d,]+\.\d{2})/i);
  totalDebits ??= extractSummaryAmount(lt, /Total Value for Debit\s*:?\s*([\d,]+\.\d{2})/i);
}

const detectedAccount = detectPaymentAccount(bankName, currency);
const statementOpeningBalance = statementClosingBalance !== null && totalCredits !== null && totalDebits !== null
  ? statementClosingBalance - (totalCredits - totalDebits)
  : null;
const columns = findColumnHeaders(items, lines);
if (!columns) { console.log('No columns found!'); process.exit(1); }

const minAmountCol = Math.min(columns.debitCol, columns.creditCol);
const transactions = [];
let pendingTransaction = null;
let preBuffer = '';

const flushPendingTransaction = () => {
  if (!pendingTransaction) return;
  pendingTransaction.description = cleanDescription(pendingTransaction.description);
  transactions.push(pendingTransaction);
  pendingTransaction = null;
};

for (const line of lines) {
  const lineText = normalizeWhitespace(line.items.map(i => i.text).join(' '));
  if (!lineText || isHeaderOrSummaryLine(lineText)) continue;
  const lineDate = extractDateFromLine(line.items);
  let debitAmount = 0, creditAmount = 0;
  const descriptionParts = [];
  for (const item of line.items) {
    if (TIME_PATTERN.test(item.text)) continue;
    if (AMOUNT_PATTERN.test(item.text)) {
      const at = classifyAmountColumn(item.col, columns);
      const a = parseAmount(item.text);
      if (at === 'debit') debitAmount = a;
      if (at === 'credit') creditAmount = a;
      continue;
    }
    if (DATE_PATTERN.test(item.text)) continue;
    if (item.text.match(DATE_INLINE_PATTERN) && item.col < minAmountCol - 20) continue;
    if (item.col < minAmountCol - 20) descriptionParts.push(item.text);
  }
  const hasAmount = debitAmount > 0 || creditAmount > 0;
  const rawDescription = descriptionParts.join(' ');
  const descriptionText = cleanDescription(rawDescription);
  const refNo = extractReferenceNo(rawDescription);

  if (lineDate && hasAmount) {
    flushPendingTransaction();
    const fullDescription = preBuffer ? cleanDescription(`${preBuffer} ${descriptionText}`) : descriptionText;
    const fullRefNo = refNo || extractReferenceNo(preBuffer);
    preBuffer = '';
    pendingTransaction = { date: lineDate, description: fullDescription, amount: creditAmount > 0 ? creditAmount : -debitAmount, paymentAccount: detectedAccount, referenceNo: fullRefNo };
    continue;
  }

  // Amount-only line (no date): inherit date from pending or preBuffer
  if (!lineDate && hasAmount) {
    const inheritedDate = pendingTransaction?.date || parseDate(preBuffer) || null;
    if (inheritedDate) {
      flushPendingTransaction();
      const fullDescription = preBuffer ? cleanDescription(`${preBuffer} ${descriptionText}`) : descriptionText;
      const fullRefNo = refNo || extractReferenceNo(preBuffer);
      preBuffer = '';
      pendingTransaction = { date: inheritedDate, description: fullDescription, amount: creditAmount > 0 ? creditAmount : -debitAmount, paymentAccount: detectedAccount, referenceNo: fullRefNo };
    }
    continue;
  }

  // Continuation line: no amount
  if (!hasAmount && descriptionText !== 'Transaction') {
    if (refNo && pendingTransaction) {
      flushPendingTransaction();
      preBuffer = rawDescription;
    } else if (pendingTransaction) {
      pendingTransaction.description = cleanDescription(`${pendingTransaction.description} ${descriptionText}`);
      if (!pendingTransaction.referenceNo && refNo) pendingTransaction.referenceNo = refNo;
    } else {
      preBuffer = preBuffer ? `${preBuffer} ${rawDescription}` : rawDescription;
    }
  }
}
flushPendingTransaction();

console.log(`Bank: ${bankName}, Currency: ${currency}, Detected: ${detectedAccount}`);
console.log(`Opening: ${statementOpeningBalance}, Closing: ${statementClosingBalance}`);
console.log(`Total: ${transactions.length}\n`);

// Show first 30 and check specific ones
transactions.slice(0, 60).forEach((tx, i) => {
  console.log(`[${i+1}] ${tx.date} | ${tx.amount >= 0 ? '+' : ''}${tx.amount.toLocaleString()} | Ref: ${tx.referenceNo || '-'}`);
  console.log(`    Desc: ${tx.description}`);
});
