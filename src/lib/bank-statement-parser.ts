import * as pdfjsLib from 'pdfjs-dist';
import type { PaymentAccount } from '@/types/real-time';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  paymentAccount: PaymentAccount;
  referenceNo: string | null;
}

export interface ParsedStatement {
  bankName: string;
  accountNumber: string;
  currency: string;
  transactions: ParsedTransaction[];
  detectedAccount: PaymentAccount;
  statementClosingBalance: number | null;
  statementOpeningBalance: number | null;
}

interface RawTextItem {
  page: number;
  x: number;
  y: number;
  text: string;
}

interface TextItem {
  page: number;
  row: number;
  col: number;
  text: string;
}

interface LineGroup {
  page: number;
  row: number;
  items: TextItem[];
}

interface ColumnPositions {
  debitCol: number;
  creditCol: number;
}

const LINE_TOLERANCE = 6;
const DATE_PATTERN = /^(\d{2})[./](\d{2})[./](\d{4})$/;
const DATE_INLINE_PATTERN = /(\d{2}[./]\d{2}[./]\d{4})/;
const TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/;
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
  const value = parseFloat(str.replace(/,/g, ''));
  return Number.isFinite(value) ? value : 0;
}

function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractReferenceNo(value: string): string | null {
  const match = value.match(/\bREF:\s*([a-fA-F0-9]+)\b/i);
  return match ? `REF:${match[1]}` : null;
}

function cleanDescription(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/^details\s*/i, '')
      .replace(/\bvalue date\b/gi, ' ')
      .replace(/\bbook balance\b/gi, ' ')
  ).substring(0, 200) || 'Transaction';
}

function extractSummaryAmount(lineText: string, label: RegExp): number | null {
  const match = lineText.match(label);
  return match ? parseAmount(match[1]) : null;
}

function detectRotation(items: RawTextItem[]): boolean {
  const debitItem = items.find((item) => item.text.toLowerCase() === 'debit');
  const creditItem = items.find((item) => item.text.toLowerCase() === 'credit');

  if (!debitItem || !creditItem) return false;

  const xDiff = Math.abs(debitItem.x - creditItem.x);
  const yDiff = Math.abs(debitItem.y - creditItem.y);

  return xDiff < 20 && yDiff > 50;
}

async function extractTextItems(file: File): Promise<{ items: TextItem[]; isRotated: boolean }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const rawItems: RawTextItem[] = [];

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

  return {
    items: rawItems.map((item) => ({
      page: item.page,
      row: isRotated ? item.x : item.y,
      col: isRotated ? item.y : item.x,
      text: item.text,
    })),
    isRotated,
  };
}

function groupItemsByLine(items: TextItem[]): LineGroup[] {
  const lines: LineGroup[] = [];
  const itemsByPage = new Map<number, TextItem[]>();

  for (const item of items) {
    if (!itemsByPage.has(item.page)) itemsByPage.set(item.page, []);
    itemsByPage.get(item.page)!.push(item);
  }

  for (const [page, pageItems] of [...itemsByPage.entries()].sort((a, b) => a[0] - b[0])) {
    const lineMap = new Map<number, TextItem[]>();

    for (const item of pageItems) {
      let matchedRow: number | null = null;
      for (const existingRow of lineMap.keys()) {
        if (Math.abs(existingRow - item.row) <= LINE_TOLERANCE) {
          matchedRow = existingRow;
          break;
        }
      }

      const rowKey = matchedRow ?? item.row;
      if (!lineMap.has(rowKey)) lineMap.set(rowKey, []);
      lineMap.get(rowKey)!.push(item);
    }

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

function findColumnHeaders(items: TextItem[], lines: LineGroup[]): ColumnPositions | null {
  for (const line of lines) {
    const texts = line.items.map((item) => item.text.toLowerCase());
    if (texts.includes('debit') && texts.includes('credit')) {
      const debitItem = line.items.find((item) => item.text.toLowerCase() === 'debit');
      const creditItem = line.items.find((item) => item.text.toLowerCase() === 'credit');
      if (debitItem && creditItem) {
        return { debitCol: debitItem.col, creditCol: creditItem.col };
      }
    }
  }

  const debitItem = items.find((item) => item.text.toLowerCase() === 'debit');
  const creditItem = items.find((item) => item.text.toLowerCase() === 'credit');
  if (debitItem && creditItem) {
    return { debitCol: debitItem.col, creditCol: creditItem.col };
  }

  return null;
}

function classifyAmountColumn(itemCol: number, cols: ColumnPositions): 'debit' | 'credit' | 'other' {
  const debitDistance = Math.abs(itemCol - cols.debitCol);
  const creditDistance = Math.abs(itemCol - cols.creditCol);
  const tolerance = 110;

  if (debitDistance <= tolerance && debitDistance < creditDistance) return 'debit';
  if (creditDistance <= tolerance && creditDistance < debitDistance) return 'credit';
  if (debitDistance <= tolerance) return 'debit';
  if (creditDistance <= tolerance) return 'credit';
  return 'other';
}

function extractDateFromLine(items: TextItem[]): string | null {
  for (const item of items) {
    if (DATE_PATTERN.test(item.text)) return parseDate(item.text);
    const inlineMatch = item.text.match(DATE_INLINE_PATTERN);
    if (inlineMatch) return parseDate(inlineMatch[1]);
  }
  return null;
}

function isHeaderOrSummaryLine(lineText: string): boolean {
  return /transaction summary|posting date|book balance|available balance|summary of|total value for|account bank statement|^page\s+\d/i.test(
    lineText
  );
}

export async function parseBankStatement(file: File): Promise<ParsedStatement> {
  const items = await extractTextItems(file);
  const lines = groupItemsByLine(items);

  let bankName = 'CRDB';
  let accountNumber = '';
  let currency = 'TZS';
  let statementClosingBalance: number | null = null;
  let totalCredits: number | null = null;
  let totalDebits: number | null = null;

  for (const line of lines.slice(0, 40)) {
    const lineText = line.items.map((item) => item.text).join(' ');
    if (/CRDB|CROB/i.test(lineText)) bankName = 'CRDB';
    if (/\bNMB\b/i.test(lineText) && !/TRANSFER|FT|TO|FROM/i.test(lineText)) bankName = 'NMB';
    const accountMatch = lineText.match(/Account\s*:?\s*(\d+)/i);
    if (accountMatch) accountNumber = accountMatch[1];
    if (/\bUSD\b/i.test(lineText)) currency = 'USD';
    if (/\bTZS\b/i.test(lineText)) currency = 'TZS';

    statementClosingBalance ??=
      extractSummaryAmount(lineText, /Available Balance\s*:?\s*([\d,]+\.\d{2})/i) ??
      extractSummaryAmount(lineText, /Summary of Book Balance(?:\s+as\s+at\s+[^:]+)?\s*:?\s*([\d,]+\.\d{2})/i) ??
      extractSummaryAmount(lineText, /Summary of Cleared Balance(?:\s+as\s+at\s+[^:]+)?\s*:?\s*([\d,]+\.\d{2})/i);

    totalCredits ??= extractSummaryAmount(lineText, /Total Value for Credit\s*:?\s*([\d,]+\.\d{2})/i);
    totalDebits ??= extractSummaryAmount(lineText, /Total Value for Debit\s*:?\s*([\d,]+\.\d{2})/i);
  }

  const detectedAccount = detectPaymentAccount(bankName, currency);
  const statementOpeningBalance =
    statementClosingBalance !== null && totalCredits !== null && totalDebits !== null
      ? statementClosingBalance - (totalCredits - totalDebits)
      : null;
  const columns = findColumnHeaders(items, lines);

  if (!columns) {
    console.warn('Bank statement parser: could not detect Debit/Credit columns');
    return {
      bankName,
      accountNumber,
      currency,
      transactions: [],
      detectedAccount,
      statementClosingBalance,
      statementOpeningBalance,
    };
  }

  const minAmountCol = Math.min(columns.debitCol, columns.creditCol);
  const transactions: ParsedTransaction[] = [];
  let pendingTransaction: ParsedTransaction | null = null;
  let preBuffer: string = '';  // Buffer for description text that appears before a date+amount line

  const flushPendingTransaction = () => {
    if (!pendingTransaction) return;
    pendingTransaction.description = cleanDescription(pendingTransaction.description);
    transactions.push(pendingTransaction);
    pendingTransaction = null;
  };

  for (const line of lines) {
    const lineText = normalizeWhitespace(line.items.map((item) => item.text).join(' '));
    if (!lineText || isHeaderOrSummaryLine(lineText)) continue;

    const lineDate = extractDateFromLine(line.items);
    let debitAmount = 0;
    let creditAmount = 0;
    const descriptionParts: string[] = [];

    for (const item of line.items) {
      if (TIME_PATTERN.test(item.text)) continue;

      if (AMOUNT_PATTERN.test(item.text)) {
        const amountType = classifyAmountColumn(item.col, columns);
        const amount = parseAmount(item.text);
        if (amountType === 'debit') debitAmount = amount;
        if (amountType === 'credit') creditAmount = amount;
        continue;
      }

      if (DATE_PATTERN.test(item.text)) continue;
      if (item.text.match(DATE_INLINE_PATTERN) && item.col < minAmountCol - 20) continue;

      if (item.col < minAmountCol - 20) {
        descriptionParts.push(item.text);
      }
    }

    const hasAmount = debitAmount > 0 || creditAmount > 0;
    const rawDescription = descriptionParts.join(' ');
    const descriptionText = cleanDescription(rawDescription);
    const refNo = extractReferenceNo(rawDescription);

    if (lineDate && hasAmount) {
      flushPendingTransaction();
      // Prepend any buffered description text from preceding non-date/non-amount lines
      const fullDescription = preBuffer
        ? cleanDescription(`${preBuffer} ${descriptionText}`)
        : descriptionText;
      const fullRefNo = refNo || extractReferenceNo(preBuffer);
      preBuffer = '';
      pendingTransaction = {
        date: lineDate,
        description: fullDescription,
        amount: creditAmount > 0 ? creditAmount : -debitAmount,
        paymentAccount: detectedAccount,
        referenceNo: fullRefNo,
      };
      continue;
    }

    // Amount-only line (no date): create transaction inheriting date from pending or preBuffer
    if (!lineDate && hasAmount) {
      const inheritedDate = pendingTransaction?.date || parseDate(preBuffer) || null;
      if (inheritedDate) {
        flushPendingTransaction();
        const fullDescription = preBuffer
          ? cleanDescription(`${preBuffer} ${descriptionText}`)
          : descriptionText;
        const fullRefNo = refNo || extractReferenceNo(preBuffer);
        preBuffer = '';
        pendingTransaction = {
          date: inheritedDate,
          description: fullDescription,
          amount: creditAmount > 0 ? creditAmount : -debitAmount,
          paymentAccount: detectedAccount,
          referenceNo: fullRefNo,
        };
      }
      continue;
    }

    // Continuation line: no amount (may or may not have a date)
    if (!hasAmount && descriptionText !== 'Transaction') {
      // If this continuation line contains a REF: pattern, it likely belongs to the NEXT transaction
      if (refNo && pendingTransaction) {
        // Flush current transaction and buffer this text for the next one
        flushPendingTransaction();
        preBuffer = rawDescription;
      } else if (pendingTransaction) {
        // Normal continuation: append to current pending transaction
        pendingTransaction.description = cleanDescription(`${pendingTransaction.description} ${descriptionText}`);
        if (!pendingTransaction.referenceNo && refNo) {
          pendingTransaction.referenceNo = refNo;
        }
      } else {
        // No pending transaction yet, buffer for the next one
        preBuffer = preBuffer ? `${preBuffer} ${rawDescription}` : rawDescription;
      }
    }
  }

  flushPendingTransaction();

  return {
    bankName,
    accountNumber,
    currency,
    transactions,
    detectedAccount,
    statementClosingBalance,
    statementOpeningBalance,
  };
}
