import * as pdfjsLib from 'pdfjs-dist';
import type { PaymentAccount } from '@/types/real-time';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedTransaction {
  date: string; // yyyy-MM-dd
  reference: string;
  description: string;
  amount: number; // positive = credit/inflow, negative = debit/outflow
  balance: number;
  item: string; // auto-categorized
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

/** Auto-categorize a transaction into a short item label */
function categorizeTransaction(text: string): string {
  const t = text.toUpperCase();

  if (t.includes('SALARY') || t.includes('SALARI')) return 'SALARY';
  if (t.includes('SWIFT')) return 'SWIFT TRANSFER';
  if (t.includes('GEPG') || t.includes('GEPG')) return 'GOVT PAYMENT';
  if (t.includes('MT103')) return 'INTL TRANSFER';
  if (t.includes('AIR FREIGHT') || t.includes('FREIGHT')) return 'AIR FREIGHT';
  if (t.includes('REVERSAL') || t.includes('Reversal')) return 'REVERSAL';
  if (t.includes('C2BMPESA') || t.includes('MPESA DEPOSIT')) return 'MPESA DEPOSIT';
  if (t.includes('TIGOPESA') || t.includes('TIGO')) return 'TIGOPESA';
  if (t.includes('MPESA')) return 'MPESA';
  if (t.includes('AIRTELMONEY') || t.includes('AIRTEL')) return 'AIRTEL MONEY';
  if (t.includes('HALOPESA') || t.includes('HALOTEL')) return 'HALOPESA';
  if (t.includes('AGENCY FT')) return 'AGENCY DEPOSIT';
  if (t.includes('ESB TIPS')) return 'BANK TRANSFER IN';
  if (t.includes('SIMAPP FT') || t.includes('SIMUSSD FT')) return 'MOBILE TRANSFER IN';
  if (t.includes('IB FT FROM') || t.includes('IB FT TO')) return 'BANK TRANSFER';
  if (t.includes('DEPOSIT')) return 'DEPOSIT';
  if (t.includes('TRANSFER')) return 'TRANSFER';

  return 'TRANSACTION';
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

/** Clean description: extract the meaningful parts only */
function cleanDescription(rawRef: string, rawDesc: string): string {
  const combined = `${rawRef} ${rawDesc}`;
  
  // Remove noise: REF codes, timestamps, 00:00:00, N/A, account numbers
  let clean = combined
    .replace(/REF:[a-f0-9]+/gi, '')
    .replace(/BE [A-Z0-9]+/g, '')
    .replace(/TZ#[^\s]+/g, '')
    .replace(/Reversal:/gi, 'REVERSAL ')
    .replace(/\d{2}:\d{2}:\d{2}/g, '')
    .replace(/\d{2}\.\d{2}\.\d{4}/g, '')
    .replace(/00:00:00/g, '')
    .replace(/N\/A/g, '')
    .replace(/CHARGE:/gi, '')
    .replace(/[\d,]+\.\d{2}/g, '')
    .replace(/AB\d+:[^:]+:?/g, '') // Agency FT codes
    .replace(/\d{3}-[A-Z0-9]+/g, '') // ESB TIPS codes
    .replace(/\b25[567]\d{9}\b/g, '') // Phone numbers
    .replace(/ACC \d+/g, '')
    .replace(/\bIB\b/g, '')
    .replace(/\bFT\b/g, '')
    .replace(/\bFROM\b/gi, 'from')
    .replace(/\bTO\b/gi, 'to')
    .replace(/\bVIA\b/gi, 'via')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading/trailing prepositions
  clean = clean.replace(/^(from|to|via)\s+/i, '').replace(/\s+(from|to|via)$/i, '');

  return clean.substring(0, 150) || 'Transaction';
}

/** Check if a transaction is a bank fee/charge/VAT (noise) */
function isBankFee(text: string): boolean {
  const t = text.toUpperCase();
  return (
    (t.includes('VAT') && t.includes('PAYABLE')) ||
    (t.includes('CHARGE:') && !t.includes('REVERSAL')) ||
    (t.includes('COMMISISON') || t.includes('COMMISSION'))
  );
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

/** Main parser - extracts transactions from CRDB-style bank statement PDF */
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
  
  // Collect all balance values and amounts from the statement
  // Strategy: find lines with date patterns, extract all numbers, use balance progression
  const rawTransactions: {
    date: string;
    fullText: string;
    amounts: number[];
    isFee: boolean;
  }[] = [];

  const datePattern = /^(\d{2}\.\d{2}\.\d{4})/;
  
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
    const amountPattern = /[\d,]+\.\d{2}/g;
    const amounts = [...fullText.matchAll(amountPattern)].map(m => parseAmount(m[0]));

    const fee = isBankFee(fullText);

    rawTransactions.push({
      date: parsedDate,
      fullText,
      amounts,
      isFee: fee,
    });

    i = j;
  }

  // Now determine direction using balance column (last number in each row)
  // Balance is always the last amount. Compare consecutive balances.
  const transactions: ParsedTransaction[] = [];
  
  for (let idx = 0; idx < rawTransactions.length; idx++) {
    const raw = rawTransactions[idx];
    if (raw.amounts.length < 2) continue; // Need at least amount + balance
    
    // Skip bank fees/charges/VAT - they're noise
    if (raw.isFee) continue;

    const balance = raw.amounts[raw.amounts.length - 1];
    
    // Find the previous balance to determine direction
    let prevBalance: number | null = null;
    for (let k = idx - 1; k >= 0; k--) {
      if (rawTransactions[k].amounts.length >= 2) {
        prevBalance = rawTransactions[k].amounts[rawTransactions[k].amounts.length - 1];
        break;
      }
    }

    // Determine the transaction amount
    // The actual movement amount is one of the non-balance numbers
    const candidateAmounts = raw.amounts.slice(0, -1).filter(a => a > 0);
    
    let txAmount = 0;
    if (prevBalance !== null) {
      // Use balance difference to determine direction
      const diff = balance - prevBalance;
      // Find the candidate amount closest to the absolute diff
      const absDiff = Math.abs(diff);
      if (candidateAmounts.length > 0) {
        // Pick the amount that best matches the balance difference
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

    // Extract reference
    const refMatch = raw.fullText.match(/REF:[a-f0-9]+|BE [A-Z0-9]+|TZ#[^\s#]+|BE#[^\s]+/i);
    const reference = refMatch ? refMatch[0] : '';

    const description = cleanDescription(raw.fullText, '');
    const item = categorizeTransaction(raw.fullText);

    transactions.push({
      date: raw.date,
      reference,
      description,
      amount: txAmount,
      balance,
      item,
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
