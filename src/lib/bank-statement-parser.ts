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

/** Parse date from DD.MM.YYYY to yyyy-MM-dd */
function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/** Extract text items with positions from a PDF file */
async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const lineMap = new Map<number, { x: number; text: string }[]>();
    
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, text: item.str });
    }

    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = items.map(i => i.text).join(' ').trim();
      if (lineText) allLines.push(lineText);
    }
  }

  return allLines;
}

/**
 * Main parser - extracts transactions from CRDB-style bank statement PDF.
 * Only extracts: Posting Date, Details (description), Debit (out), Credit (in).
 * Item is left as default "TRANSACTION" for manual categorization.
 */
export async function parseBankStatement(file: File): Promise<ParsedStatement> {
  const lines = await extractTextFromPDF(file);
  
  // Detect bank and account info
  let bankName = 'CRDB';
  let accountNumber = '';
  let currency = 'TZS';

  for (const line of lines.slice(0, 30)) {
    if (line.match(/CRDB|CROB/i)) bankName = 'CRDB';
    if (line.match(/NMB/i) && !line.match(/TRANSFER|FT|TO|FROM/i)) bankName = 'NMB';
    const accMatch = line.match(/Account:\s*(\d+)/i);
    if (accMatch) accountNumber = accMatch[1];
    if (line.includes('USD')) currency = 'USD';
    if (line.includes('TZS')) currency = 'TZS';
  }

  const detectedAccount = detectPaymentAccount(bankName, currency);
  
  // Parse transaction lines: look for lines starting with a date pattern
  const datePattern = /^(\d{2}\.\d{2}\.\d{4})/;
  const amountPattern = /[\d,]+\.\d{2}/g;
  
  const rawTransactions: {
    date: string;
    fullText: string;
    amounts: number[];
  }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const dateMatch = line.match(datePattern);
    
    if (!dateMatch) {
      i++;
      continue;
    }

    const parsedDate = parseDate(dateMatch[1]);
    if (!parsedDate) {
      i++;
      continue;
    }

    // Collect full transaction text including continuation lines
    let fullText = line;
    let j = i + 1;
    while (j < lines.length && !lines[j].match(datePattern)) {
      if (lines[j].match(/^(Transaction Summary|Transaction Records|Page|CRDB|CROB|Account Bank|Posting Date|Date)/i)) break;
      fullText += ' ' + lines[j];
      j++;
    }

    // Extract all number patterns
    const amounts = [...fullText.matchAll(amountPattern)].map(m => parseAmount(m[0]));

    rawTransactions.push({
      date: parsedDate,
      fullText,
      amounts,
    });

    i = j;
  }

  // Determine direction using balance column (last number = balance)
  const transactions: ParsedTransaction[] = [];
  
  for (let idx = 0; idx < rawTransactions.length; idx++) {
    const raw = rawTransactions[idx];
    if (raw.amounts.length < 2) continue; // Need at least amount + balance

    const balance = raw.amounts[raw.amounts.length - 1];
    
    // Find the previous balance
    let prevBalance: number | null = null;
    for (let k = idx - 1; k >= 0; k--) {
      if (rawTransactions[k].amounts.length >= 2) {
        prevBalance = rawTransactions[k].amounts[rawTransactions[k].amounts.length - 1];
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
      // First transaction - guess from context
      const isCredit = raw.fullText.match(/SIMAPP FT|SIMUSSD FT|ESB TIPS|AGENCY FT|DEPOSIT|MT103/i);
      const mainAmount = candidateAmounts.length > 0 ? Math.max(...candidateAmounts) : 0;
      txAmount = isCredit ? mainAmount : -mainAmount;
    }

    if (txAmount === 0) continue;

    // Extract description: remove the date prefix and numeric values, keep the text
    let description = raw.fullText
      .replace(/^\d{2}\.\d{2}\.\d{4}\s*/, '') // Remove leading date
      .replace(/[\d,]+\.\d{2}/g, '')           // Remove all amounts
      .replace(/\d{2}:\d{2}:\d{2}/g, '')       // Remove timestamps
      .replace(/\s+/g, ' ')
      .trim();

    // Cap description length
    description = description.substring(0, 200) || 'Transaction';

    transactions.push({
      date: raw.date,
      description,
      amount: txAmount,
      paymentAccount: detectedAccount,
    });
  }

  return {
    bankName,
    accountNumber,
    currency,
    transactions,
    detectedAccount,
  };
}
