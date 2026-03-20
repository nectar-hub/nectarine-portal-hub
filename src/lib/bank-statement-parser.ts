import * as pdfjsLib from 'pdfjs-dist';
import type { PaymentAccount } from '@/types/real-time';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  paymentAccount: PaymentAccount;
}

export interface ParsedStatement {
  bankName: string;
  accountNumber: string;
  currency: string;
  transactions: ParsedTransaction[];
  detectedAccount: PaymentAccount;
}

interface TextItem {
  page: number;
  row: number;  // vertical position (used for row grouping)
  col: number;  // horizontal position (used for column classification)
  text: string;
}

const LINE_TOLERANCE = 5;
const DATE_PATTERN = /^(\d{2})[./](\d{2})[./](\d{4})$/;
const AMOUNT_PATTERN = /^[\d,]+\.\d{2}$/;

function detectPaymentAccount(bankName: string, currency: string): PaymentAccount {
  const bank = bankName.toUpperCase();
  if (bank.includes('CRDB') || bank.includes('CROB')) {
    return currency.toUpperCase() === 'USD' ? 'CRDB_USD' : 'CRDB';
  }
  if (bank.includes('NMB')) return 'NMB_CARD';
  if (bank.includes('MPESA') || bank.includes('M-PESA')) return 'MPESA_271';
  return 'CASH';
}

function parseAmount(str: string): number {
  if (!str) return 0;
  const num = parseFloat(str.replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Detect if the PDF uses rotated coordinates.
 * In rotated PDFs, column headers (Debit, Credit) share the same x but differ in y.
 * In normal PDFs, they share the same y but differ in x.
 */
function detectRotation(items: { x: number; y: number; text: string }[]): boolean {
  const debitItems = items.filter(i => i.text.toLowerCase() === 'debit');
  const creditItems = items.filter(i => i.text.toLowerCase() === 'credit');

  if (debitItems.length === 0 || creditItems.length === 0) return false;

  const d = debitItems[0];
  const c = creditItems[0];

  // If they share similar x but different y → rotated (y is horizontal)
  // If they share similar y but different x → normal (x is horizontal)
  const xDiff = Math.abs(d.x - c.x);
  const yDiff = Math.abs(d.y - c.y);

  return xDiff < 20 && yDiff > 50; // rotated: same x, spread y
}

async function extractTextItems(file: File): Promise<TextItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // First pass: collect raw items to detect rotation
  const rawItems: { page: number; x: number; y: number; text: string }[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      rawItems.push({
        page: pageNumber,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        text: item.str.trim(),
      });
    }
  }

  const isRotated = detectRotation(rawItems);

  // Map to normalized coordinates
  return rawItems.map(item => ({
    page: item.page,
    // For rotated PDFs: x=vertical(row), y=horizontal(col)
    // For normal PDFs: y=vertical(row), x=horizontal(col)
    row: isRotated ? item.x : item.y,
    col: isRotated ? item.y : item.x,
    text: item.text,
  }));
}

interface LineGroup {
  page: number;
  row: number;
  items: TextItem[];
}

function groupItemsByLine(items: TextItem[]): LineGroup[] {
  const lines: LineGroup[] = [];

  const byPage = new Map<number, TextItem[]>();
  for (const item of items) {
    if (!byPage.has(item.page)) byPage.set(item.page, []);
    byPage.get(item.page)!.push(item);
  }

  for (const [page, pageItems] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
    const lineMap = new Map<number, TextItem[]>();

    for (const item of pageItems) {
      let matchedRow: number | null = null;
      for (const existingRow of lineMap.keys()) {
        if (Math.abs(existingRow - item.row) <= LINE_TOLERANCE) {
          matchedRow = existingRow;
          break;
        }
      }
      const key = matchedRow ?? item.row;
      if (!lineMap.has(key)) lineMap.set(key, []);
      lineMap.get(key)!.push(item);
    }

    // Sort rows: for normal PDFs y decreases top-to-bottom, for rotated x decreases top-to-bottom
    for (const [row, lineItems] of [...lineMap.entries()].sort((a, b) => b[0] - a[0])) {
      lines.push({
        page,
        row,
        items: lineItems.sort((a, b) => a.col - b.col),
      });
    }
  }

  return lines;
}

interface ColumnPositions {
  debitCol: number;
  creditCol: number;
}

function findColumnHeaders(lines: LineGroup[]): ColumnPositions | null {
  for (const line of lines) {
    const texts = line.items.map(i => i.text.toLowerCase());
    if (texts.includes('debit') && texts.includes('credit')) {
      const debitItem = line.items.find(i => i.text.toLowerCase() === 'debit');
      const creditItem = line.items.find(i => i.text.toLowerCase() === 'credit');

      if (debitItem && creditItem) {
        return {
          debitCol: debitItem.col,
          creditCol: creditItem.col,
        };
      }
    }
  }
  return null;
}

function classifyAmountColumn(itemCol: number, cols: ColumnPositions): 'debit' | 'credit' | 'other' {
  const distDebit = Math.abs(itemCol - cols.debitCol);
  const distCredit = Math.abs(itemCol - cols.creditCol);
  const tolerance = 100;

  if (distDebit <= tolerance && distDebit < distCredit) return 'debit';
  if (distCredit <= tolerance && distCredit < distDebit) return 'credit';
  if (distDebit <= tolerance) return 'debit';
  if (distCredit <= tolerance) return 'credit';
  return 'other';
}

export async function parseBankStatement(file: File): Promise<ParsedStatement> {
  const items = await extractTextItems(file);
  const lines = groupItemsByLine(items);

  // Detect bank info from top lines
  let bankName = 'CRDB';
  let accountNumber = '';
  let currency = 'TZS';

  for (const line of lines.slice(0, 30)) {
    const lineText = line.items.map(i => i.text).join(' ');
    if (/CRDB|CROB/i.test(lineText)) bankName = 'CRDB';
    if (/\bNMB\b/i.test(lineText) && !/TRANSFER|FT|TO|FROM/i.test(lineText)) bankName = 'NMB';
    const accMatch = lineText.match(/Account\s*:?\s*(\d+)/i);
    if (accMatch) accountNumber = accMatch[1];
    if (/\bUSD\b/i.test(lineText)) currency = 'USD';
    if (/\bTZS\b/i.test(lineText)) currency = 'TZS';
  }

  const detectedAccount = detectPaymentAccount(bankName, currency);
  const cols = findColumnHeaders(lines);

  if (!cols) {
    console.warn('Bank statement parser: could not detect Debit/Credit column headers');
    return { bankName, accountNumber, currency, transactions: [], detectedAccount };
  }

  const transactions: ParsedTransaction[] = [];
  let currentDate: string | null = null;
  const minAmountCol = Math.min(cols.debitCol, cols.creditCol);

  for (const line of lines) {
    const lineText = line.items.map(i => i.text).join(' ');

    // Skip header/summary lines
    if (/Transaction Summary|Posting Date|Date\s+Reference/i.test(lineText)) continue;
    if (/^Page\s+\d/i.test(lineText)) continue;

    // Check if this line has a date
    const firstItem = line.items[0];
    if (firstItem && DATE_PATTERN.test(firstItem.text)) {
      const parsed = parseDate(firstItem.text);
      if (parsed) currentDate = parsed;
    }

    if (!currentDate) continue;

    // Extract amounts and description from this line
    let debitAmount = 0;
    let creditAmount = 0;
    const descParts: string[] = [];

    for (const item of line.items) {
      if (DATE_PATTERN.test(item.text)) continue;
      if (/^\d{2}:\d{2}:\d{2}$/.test(item.text)) continue;

      if (AMOUNT_PATTERN.test(item.text)) {
        const col = classifyAmountColumn(item.col, cols);
        const val = parseAmount(item.text);
        if (col === 'debit') debitAmount = val;
        else if (col === 'credit') creditAmount = val;
        continue;
      }

      // Text in the details area (before amount columns)
      if (item.col < minAmountCol - 20) {
        descParts.push(item.text);
      }
    }

    // Only create transaction if we have a real debit or credit (skip 0.00 entries)
    if (debitAmount > 0 || creditAmount > 0) {
      const amount = creditAmount > 0 ? creditAmount : -debitAmount;
      const description = descParts.join(' ').replace(/\s+/g, ' ').trim() || 'Transaction';

      transactions.push({
        date: currentDate,
        description: description.substring(0, 200),
        amount,
        paymentAccount: detectedAccount,
      });
    }
  }

  return { bankName, accountNumber, currency, transactions, detectedAccount };
}
