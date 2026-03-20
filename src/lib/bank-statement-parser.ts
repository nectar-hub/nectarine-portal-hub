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

interface LineItemGroup {
  page: number;
  y: number;
  text: string;
  items: TextItem[];
}

interface ColumnLayout {
  page: number;
  headerY: number;
  debitX: number;
  creditX: number;
  balanceX: number;
}

const LINE_Y_TOLERANCE = 3;
const AMOUNT_PATTERN = /^(?:\(?-?)?\d[\d,.\s]*\d(?:[.,]\d{2})\)?$/;
const DATE_PATTERN = /^(\d{2}[./]\d{2}[./]\d{4})/;
const TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/;

function detectPaymentAccount(bankName: string, currency: string): PaymentAccount {
  const bank = bankName.toUpperCase();
  if (bank.includes('CRDB') || bank.includes('CROB')) {
    return currency.toUpperCase() === 'USD' ? 'CRDB_USD' : 'CRDB';
  }
  if (bank.includes('NMB')) return 'NMB_CARD';
  if (bank.includes('MPESA') || bank.includes('M-PESA')) return 'MPESA_271';
  return 'CASH';
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function parseAmount(str: string): number {
  if (!str) return 0;

  let cleaned = str
    .replace(/[()]/g, '')
    .replace(/\s/g, '')
    .replace(/[A-Za-z]/g, '')
    .trim();

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastDot !== -1 || lastComma !== -1) {
    if (lastDot > lastComma) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  }

  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function cleanDescription(text: string): string {
  const cleaned = text
    .replace(/\b(?:debit|credit|balance|posting date|value date)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.substring(0, 200) || 'Transaction';
}

async function extractTextItems(file: File): Promise<{ items: TextItem[]; pageCount: number }> {
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

  return { items: allItems, pageCount: pdf.numPages };
}

function groupItemsByLine(items: TextItem[]): LineItemGroup[] {
  const pages = new Map<number, TextItem[]>();

  for (const item of items) {
    if (!pages.has(item.page)) pages.set(item.page, []);
    pages.get(item.page)!.push(item);
  }

  const lines: LineItemGroup[] = [];

  for (const [page, pageItems] of [...pages.entries()].sort((a, b) => a[0] - b[0])) {
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

    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      lines.push({
        page,
        y,
        items: lineItems,
        text: lineItems.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim(),
      });
    }
  }

  return lines;
}

function detectColumns(lines: LineItemGroup[]): ColumnLayout | null {
  for (const line of lines) {
    const normalizedLine = normalizeText(line.text);
    if (!normalizedLine.includes('debit') || !normalizedLine.includes('credit')) continue;

    const debitHeader = line.items.find((item) => normalizeText(item.text) === 'debit');
    const creditHeader = line.items.find((item) => normalizeText(item.text) === 'credit');
    const balanceHeader = line.items.find((item) => normalizeText(item.text) === 'balance');

    if (debitHeader && creditHeader) {
      return {
        page: line.page,
        headerY: line.y,
        debitX: debitHeader.x,
        creditX: creditHeader.x,
        balanceX: balanceHeader?.x ?? creditHeader.x + Math.max(80, creditHeader.x - debitHeader.x),
      };
    }
  }

  return null;
}

function classifyAmount(
  itemX: number,
  cols: { debitX: number; creditX: number; balanceX: number }
): 'debit' | 'credit' | 'balance' | 'unknown' {
  const ordered = [
    { key: 'debit' as const, x: cols.debitX },
    { key: 'credit' as const, x: cols.creditX },
    { key: 'balance' as const, x: cols.balanceX },
  ].sort((a, b) => a.x - b.x);

  const leftEdge = ordered[0].x - 70;
  const rightEdge = ordered[2].x + 70;
  if (itemX < leftEdge || itemX > rightEdge) return 'unknown';

  const firstBoundary = (ordered[0].x + ordered[1].x) / 2;
  const secondBoundary = (ordered[1].x + ordered[2].x) / 2;

  if (itemX < firstBoundary) return ordered[0].key;
  if (itemX < secondBoundary) return ordered[1].key;
  return ordered[2].key;
}

export async function parseBankStatement(file: File): Promise<ParsedStatement> {
  const { items } = await extractTextItems(file);
  const lines = groupItemsByLine(items);

  let bankName = 'CRDB';
  let accountNumber = '';
  let currency = 'TZS';

  const topLines = lines.slice(0, 40);
  for (const line of topLines) {
    if (/CRDB|CROB/i.test(line.text)) bankName = 'CRDB';
    if (/\bNMB\b/i.test(line.text) && !/TRANSFER|FT|TO|FROM/i.test(line.text)) bankName = 'NMB';

    const accMatch = line.text.match(/Account\s*:?\s*(\d+)/i);
    if (accMatch) accountNumber = accMatch[1];
    if (/\bUSD\b/i.test(line.text)) currency = 'USD';
    if (/\bTZS\b/i.test(line.text)) currency = 'TZS';
  }

  const detectedAccount = detectPaymentAccount(bankName, currency);
  const cols = detectColumns(lines);

  if (!cols) {
    return fallbackParse(lines, bankName, accountNumber, currency, detectedAccount);
  }

  const transactions: ParsedTransaction[] = [];
  let currentDate: string | null = null;
  let descParts: string[] = [];
  let currentDebit = 0;
  let currentCredit = 0;
  let hasAmount = false;

  const flushTransaction = () => {
    if (currentDate && hasAmount) {
      const amount = currentCredit > 0 ? currentCredit : -currentDebit;
      if (amount !== 0) {
        transactions.push({
          date: currentDate,
          description: cleanDescription(descParts.join(' ')),
          amount,
          paymentAccount: detectedAccount,
        });
      }
    }

    descParts = [];
    currentDebit = 0;
    currentCredit = 0;
    hasAmount = false;
  };

  for (const line of lines) {
    if (
      line.page === cols.page &&
      line.y >= cols.headerY - LINE_Y_TOLERANCE &&
      normalizeText(line.text).includes('debit')
    ) {
      continue;
    }

    if (/^(Transaction Summary|Transaction Records|Page\s+\d|Posting Date|Date\s+Value|Opening Balance)/i.test(line.text)) {
      continue;
    }

    const dateMatch = line.text.match(DATE_PATTERN);
    if (dateMatch) {
      const parsed = parseDate(dateMatch[1]);
      if (parsed) {
        flushTransaction();
        currentDate = parsed;
      }
    }

    if (!currentDate) continue;

    for (const item of line.items) {
      if (AMOUNT_PATTERN.test(item.text)) {
        const classification = classifyAmount(item.x, cols);
        const amount = parseAmount(item.text);

        if (classification === 'debit' && amount > 0) {
          currentDebit = amount;
          hasAmount = true;
        } else if (classification === 'credit' && amount > 0) {
          currentCredit = amount;
          hasAmount = true;
        }
        continue;
      }

      if (DATE_PATTERN.test(item.text) || TIME_PATTERN.test(item.text)) continue;
      if (item.x >= Math.min(cols.debitX, cols.creditX) - 12) continue;

      descParts.push(item.text);
    }
  }

  flushTransaction();

  return {
    bankName,
    accountNumber,
    currency,
    transactions,
    detectedAccount,
  };
}

function fallbackParse(
  lines: LineItemGroup[],
  bankName: string,
  accountNumber: string,
  currency: string,
  detectedAccount: PaymentAccount
): ParsedStatement {
  const transactions: ParsedTransaction[] = [];
  const rawTx: { date: string; fullText: string; amounts: number[] }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].text;
    const dateMatch = line.match(DATE_PATTERN);
    if (!dateMatch) {
      i++;
      continue;
    }

    const parsedDate = parseDate(dateMatch[1]);
    if (!parsedDate) {
      i++;
      continue;
    }

    let fullText = line;
    let j = i + 1;
    while (j < lines.length && !lines[j].text.match(DATE_PATTERN)) {
      if (/^(Transaction Summary|Transaction Records|Page|CRDB|CROB|Posting Date)/i.test(lines[j].text)) break;
      fullText += ` ${lines[j].text}`;
      j++;
    }

    const amounts = [...fullText.matchAll(/\d[\d,.]*[.,]\d{2}/g)].map((match) => parseAmount(match[0]));
    rawTx.push({ date: parsedDate, fullText, amounts });
    i = j;
  }

  for (let idx = 0; idx < rawTx.length; idx++) {
    const raw = rawTx[idx];
    if (raw.amounts.length < 2) continue;

    const balance = raw.amounts[raw.amounts.length - 1];
    let prevBalance: number | null = null;
    for (let k = idx - 1; k >= 0; k--) {
      if (rawTx[k].amounts.length >= 2) {
        prevBalance = rawTx[k].amounts[rawTx[k].amounts.length - 1];
        break;
      }
    }

    const candidateAmounts = raw.amounts.slice(0, -1).filter((amount) => amount > 0);
    let txAmount = 0;

    if (prevBalance !== null) {
      const diff = balance - prevBalance;
      const absDiff = Math.abs(diff);
      if (candidateAmounts.length > 0) {
        const bestMatch = candidateAmounts.reduce((best, amount) =>
          Math.abs(amount - absDiff) < Math.abs(best - absDiff) ? amount : best
        );
        txAmount = diff > 0 ? Math.abs(bestMatch) : -Math.abs(bestMatch);
      } else {
        txAmount = diff;
      }
    } else {
      const isCredit = /SIMAPP FT|SIMUSSD FT|ESB TIPS|AGENCY FT|DEPOSIT|MT103/i.test(raw.fullText);
      const mainAmount = candidateAmounts.length > 0 ? Math.max(...candidateAmounts) : 0;
      txAmount = isCredit ? mainAmount : -mainAmount;
    }

    if (txAmount === 0) continue;

    const description = cleanDescription(
      raw.fullText
        .replace(/^\d{2}[./]\d{2}[./]\d{4}\s*/g, '')
        .replace(/\d[\d,.]*[.,]\d{2}/g, '')
        .replace(/\d{2}:\d{2}:\d{2}/g, '')
    );

    transactions.push({
      date: raw.date,
      description,
      amount: txAmount,
      paymentAccount: detectedAccount,
    });
  }

  return { bankName, accountNumber, currency, transactions, detectedAccount };
}
