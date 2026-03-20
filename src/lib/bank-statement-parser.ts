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
  x: number;
  y: number;
  text: string;
}

const LINE_Y_TOLERANCE = 3;
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
  const cleaned = str.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

async function extractTextItems(file: File): Promise<TextItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allItems: TextItem[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      allItems.push({
        page: pageNumber,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        text: item.str.trim(),
      });
    }
  }

  return allItems;
}

interface LineGroup {
  page: number;
  y: number;
  items: TextItem[];
}

function groupItemsByLine(items: TextItem[]): LineGroup[] {
  const lines: LineGroup[] = [];

  // Group by page first
  const byPage = new Map<number, TextItem[]>();
  for (const item of items) {
    if (!byPage.has(item.page)) byPage.set(item.page, []);
    byPage.get(item.page)!.push(item);
  }

  for (const [page, pageItems] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
    const lineMap = new Map<number, TextItem[]>();

    for (const item of pageItems) {
      let matchedY: number | null = null;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - item.y) <= LINE_Y_TOLERANCE) {
          matchedY = existingY;
          break;
        }
      }
      const key = matchedY ?? item.y;
      if (!lineMap.has(key)) lineMap.set(key, []);
      lineMap.get(key)!.push(item);
    }

    // Sort by Y descending (top of page first in PDF coordinates)
    for (const [y, lineItems] of [...lineMap.entries()].sort((a, b) => b[0] - a[0])) {
      lines.push({
        page,
        y,
        items: lineItems.sort((a, b) => a.x - b.x),
      });
    }
  }

  return lines;
}

interface ColumnPositions {
  detailsX: number;
  debitX: number;
  creditX: number;
}

function findColumnHeaders(lines: LineGroup[]): ColumnPositions | null {
  for (const line of lines) {
    const texts = line.items.map(i => i.text.toLowerCase());
    const hasDebit = texts.includes('debit');
    const hasCredit = texts.includes('credit');

    if (hasDebit && hasCredit) {
      const detailsItem = line.items.find(i => i.text.toLowerCase() === 'details');
      const debitItem = line.items.find(i => i.text.toLowerCase() === 'debit');
      const creditItem = line.items.find(i => i.text.toLowerCase() === 'credit');

      if (debitItem && creditItem) {
        return {
          detailsX: detailsItem?.x ?? 0,
          debitX: debitItem.x,
          creditX: creditItem.x,
        };
      }
    }
  }
  return null;
}

function classifyAmountColumn(itemX: number, cols: ColumnPositions): 'debit' | 'credit' | 'other' {
  const distDebit = Math.abs(itemX - cols.debitX);
  const distCredit = Math.abs(itemX - cols.creditX);

  // The amount right-aligns under its header, so allow generous tolerance
  const tolerance = 80;

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
    return { bankName, accountNumber, currency, transactions: [], detectedAccount };
  }

  const transactions: ParsedTransaction[] = [];
  let currentDate: string | null = null;

  for (const line of lines) {
    const lineText = line.items.map(i => i.text).join(' ');

    // Skip header/summary lines
    if (/Transaction Summary|Posting Date|Date\s+Reference/i.test(lineText)) continue;
    if (/^Page\s+\d/i.test(lineText)) continue;

    // Check if this line starts with a date
    const firstItem = line.items[0];
    if (firstItem && DATE_PATTERN.test(firstItem.text)) {
      const parsed = parseDate(firstItem.text);
      if (parsed) currentDate = parsed;
    }

    if (!currentDate) continue;

    // Extract amounts from this line
    let debitAmount = 0;
    let creditAmount = 0;
    const descParts: string[] = [];

    for (const item of line.items) {
      // Skip date items
      if (DATE_PATTERN.test(item.text)) continue;
      // Skip time items
      if (/^\d{2}:\d{2}:\d{2}$/.test(item.text)) continue;

      if (AMOUNT_PATTERN.test(item.text)) {
        const col = classifyAmountColumn(item.x, cols);
        const val = parseAmount(item.text);
        if (col === 'debit') debitAmount = val;
        else if (col === 'credit') creditAmount = val;
        // 'other' amounts (like balance) are ignored
        continue;
      }

      // Text that falls in the details area (before debit column)
      if (item.x < Math.min(cols.debitX, cols.creditX) - 20) {
        descParts.push(item.text);
      }
    }

    // Only create a transaction if we have an actual debit or credit
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
