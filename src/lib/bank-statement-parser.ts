import * as pdfjsLib from 'pdfjs-dist';
import type { PaymentAccount } from '@/types/real-time';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedTransaction {
  date: string; // yyyy-MM-dd
  description: string;
  amount: number; // positive = credit/inflow, negative = debit/outflow
  paymentAccount: PaymentAccount;
}

export interface ParsedStatement {
  bankName: string;
  accountNumber: string;
  currency: string;
  transactions: ParsedTransaction[];
  detectedAccount: PaymentAccount;
}

/** Detect payment account from bank name + currency */
function detectPaymentAccount(bankName: string, currency: string): PaymentAccount {
  const bank = bankName.toUpperCase();
  if (bank.includes('CRDB') || bank.includes('CROB')) {
    return currency.toUpperCase() === 'USD' ? 'CRDB_USD' : 'CRDB';
  }
  if (bank.includes('NMB')) return 'NMB_CARD';
  if (bank.includes('MPESA') || bank.includes('M-PESA')) return 'MPESA_271';
  return 'CASH';
}

/** Parse amount string like "1,234,567.89" into number */
function parseAmount(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse date from DD.MM.YYYY or DD/MM/YYYY to yyyy-MM-dd */
function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

interface TextItem {
  x: number;
  y: number;
  text: string;
}

/** Extract all text items with precise x,y positions from PDF */
async function extractTextItems(file: File): Promise<{ items: TextItem[]; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allItems: TextItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      allItems.push({
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        text: item.str.trim(),
      });
    }
  }

  return { items: allItems, pageCount: pdf.numPages };
}

/** Detect column x-ranges by finding the header row containing "Debit" and "Credit" */
function detectColumns(items: TextItem[]): { debitX: number; creditX: number; balanceX: number } | null {
  // Find the header items
  const debitHeader = items.find(i => /^debit$/i.test(i.text));
  const creditHeader = items.find(i => /^credit$/i.test(i.text));
  const balanceHeader = items.find(i => /^balance$/i.test(i.text));

  if (debitHeader && creditHeader) {
    return {
      debitX: debitHeader.x,
      creditX: creditHeader.x,
      balanceX: balanceHeader?.x ?? creditHeader.x + 100,
    };
  }
  return null;
}

/** Classify an amount item as debit, credit, or balance based on its x position */
function classifyAmount(itemX: number, cols: { debitX: number; creditX: number; balanceX: number }): 'debit' | 'credit' | 'balance' | 'unknown' {
  const tolerance = 50;
  const distDebit = Math.abs(itemX - cols.debitX);
  const distCredit = Math.abs(itemX - cols.creditX);
  const distBalance = Math.abs(itemX - cols.balanceX);

  const minDist = Math.min(distDebit, distCredit, distBalance);
  if (minDist > tolerance) return 'unknown';
  if (minDist === distDebit) return 'debit';
  if (minDist === distCredit) return 'credit';
  return 'balance';
}

/**
 * Main parser - extracts transactions from CRDB-style bank statement PDF.
 * Uses column x-positions to accurately identify Debit and Credit amounts.
 */
export async function parseBankStatement(file: File): Promise<ParsedStatement> {
  const { items } = await extractTextItems(file);

  // Detect bank and account info from top items
  let bankName = 'CRDB';
  let accountNumber = '';
  let currency = 'TZS';

  // Sort items top-to-bottom for header scanning
  const sortedByY = [...items].sort((a, b) => b.y - a.y);
  const topItems = sortedByY.slice(0, 100);

  for (const item of topItems) {
    if (/CRDB|CROB/i.test(item.text)) bankName = 'CRDB';
    if (/NMB/i.test(item.text) && !/TRANSFER|FT|TO|FROM/i.test(item.text)) bankName = 'NMB';
    const accMatch = item.text.match(/Account:\s*(\d+)/i);
    if (accMatch) accountNumber = accMatch[1];
    if (item.text.includes('USD')) currency = 'USD';
    if (item.text.includes('TZS')) currency = 'TZS';
  }

  const detectedAccount = detectPaymentAccount(bankName, currency);
  const cols = detectColumns(items);

  if (!cols) {
    console.warn('Could not detect Debit/Credit column headers, falling back to heuristic parsing');
    return fallbackParse(items, bankName, accountNumber, currency, detectedAccount);
  }

  console.log('Detected columns:', { debitX: cols.debitX, creditX: cols.creditX, balanceX: cols.balanceX });

  // Group items by y-coordinate into lines
  const lineMap = new Map<number, TextItem[]>();
  for (const item of items) {
    const y = item.y;
    // Group items within 3px of each other vertically
    let foundY: number | null = null;
    for (const existingY of lineMap.keys()) {
      if (Math.abs(existingY - y) <= 3) {
        foundY = existingY;
        break;
      }
    }
    const key = foundY ?? y;
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key)!.push(item);
  }

  // Sort lines top-to-bottom
  const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

  const datePattern = /(\d{2}[./]\d{2}[./]\d{4})/;
  const amountPattern = /^[\d,]+\.\d{2}$/;

  const transactions: ParsedTransaction[] = [];
  let currentDate: string | null = null;
  let descParts: string[] = [];
  let currentDebit = 0;
  let currentCredit = 0;
  let hasAmount = false;

  const flushTransaction = () => {
    if (currentDate && hasAmount) {
      const description = descParts.join(' ').replace(/\s+/g, ' ').trim().substring(0, 200) || 'Transaction';
      const amount = currentCredit > 0 ? currentCredit : -currentDebit;
      if (amount !== 0) {
        transactions.push({
          date: currentDate,
          description,
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

  for (const y of sortedYs) {
    const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
    const lineText = lineItems.map(i => i.text).join(' ');

    // Skip header/footer lines
    if (/^(Transaction Summary|Transaction Records|Page\s+\d|Posting Date|Date\s+Value|Opening Balance)/i.test(lineText)) continue;

    // Check if this line starts a new transaction (has a date)
    const dateMatch = lineText.match(datePattern);
    if (dateMatch) {
      const parsed = parseDate(dateMatch[1]);
      if (parsed) {
        // Flush previous transaction
        flushTransaction();
        currentDate = parsed;
      }
    }

    if (!currentDate) continue;

    // Process each item on this line
    for (const item of lineItems) {
      if (amountPattern.test(item.text)) {
        const classification = classifyAmount(item.x, cols);
        const amt = parseAmount(item.text);
        if (classification === 'debit') {
          currentDebit = amt;
          hasAmount = true;
        } else if (classification === 'credit') {
          currentCredit = amt;
          hasAmount = true;
        }
        // Skip balance column values
      } else if (!datePattern.test(item.text) && !/^\d{2}:\d{2}:\d{2}$/.test(item.text)) {
        // It's a text item (description), not a date or time
        descParts.push(item.text);
      }
    }
  }

  // Flush last transaction
  flushTransaction();

  return {
    bankName,
    accountNumber,
    currency,
    transactions,
    detectedAccount,
  };
}

/** Fallback parser when column headers can't be detected */
function fallbackParse(
  items: TextItem[],
  bankName: string,
  accountNumber: string,
  currency: string,
  detectedAccount: PaymentAccount
): ParsedStatement {
  // Group into lines
  const lineMap = new Map<number, TextItem[]>();
  for (const item of items) {
    let foundY: number | null = null;
    for (const existingY of lineMap.keys()) {
      if (Math.abs(existingY - item.y) <= 3) { foundY = existingY; break; }
    }
    const key = foundY ?? item.y;
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key)!.push(item);
  }

  const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
  const datePattern = /^(\d{2}[./]\d{2}[./]\d{4})/;
  const amountPattern = /[\d,]+\.\d{2}/g;
  const transactions: ParsedTransaction[] = [];

  const rawTx: { date: string; fullText: string; amounts: number[] }[] = [];

  let i = 0;
  const lines = sortedYs.map(y => {
    const items2 = lineMap.get(y)!.sort((a, b) => a.x - b.x);
    return items2.map(it => it.text).join(' ').trim();
  });

  while (i < lines.length) {
    const line = lines[i];
    const dateMatch = line.match(datePattern);
    if (!dateMatch) { i++; continue; }
    const parsedDate = parseDate(dateMatch[1]);
    if (!parsedDate) { i++; continue; }

    let fullText = line;
    let j = i + 1;
    while (j < lines.length && !lines[j].match(datePattern)) {
      if (/^(Transaction Summary|Transaction Records|Page|CRDB|CROB|Posting Date)/i.test(lines[j])) break;
      fullText += ' ' + lines[j];
      j++;
    }

    const amounts = [...fullText.matchAll(amountPattern)].map(m => parseAmount(m[0]));
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

    const candidateAmounts = raw.amounts.slice(0, -1).filter(a => a > 0);
    let txAmount = 0;
    if (prevBalance !== null) {
      const diff = balance - prevBalance;
      const absDiff = Math.abs(diff);
      if (candidateAmounts.length > 0) {
        const bestMatch = candidateAmounts.reduce((best, amt) =>
          Math.abs(amt - absDiff) < Math.abs(best - absDiff) ? amt : best
        );
        txAmount = diff > 0 ? Math.abs(bestMatch) : -Math.abs(bestMatch);
      } else {
        txAmount = diff;
      }
    } else {
      const isCredit = raw.fullText.match(/SIMAPP FT|SIMUSSD FT|ESB TIPS|AGENCY FT|DEPOSIT|MT103/i);
      const mainAmount = candidateAmounts.length > 0 ? Math.max(...candidateAmounts) : 0;
      txAmount = isCredit ? mainAmount : -mainAmount;
    }

    if (txAmount === 0) continue;

    let description = raw.fullText
      .replace(/^\d{2}[./]\d{2}[./]\d{4}\s*/g, '')
      .replace(/[\d,]+\.\d{2}/g, '')
      .replace(/\d{2}:\d{2}:\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    description = description.substring(0, 200) || 'Transaction';

    transactions.push({ date: raw.date, description, amount: txAmount, paymentAccount: detectedAccount });
  }

  return { bankName, accountNumber, currency, transactions, detectedAccount };
}
