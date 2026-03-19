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
function categorizeTransaction(ref: string, desc: string): string {
  const combined = `${ref} ${desc}`.toUpperCase();

  if (combined.includes('SALARY') || combined.includes('SALARI')) return 'SALARY';
  if (combined.includes('VAT') && combined.includes('PAYABLE')) return 'VAT/TAX';
  if (combined.includes('CHARGE:') || combined.includes('COMMISSION')) return 'BANK CHARGES';
  if (combined.includes('SWIFT')) return 'SWIFT TRANSFER';
  if (combined.includes('GEPG') || combined.includes('GePG')) return 'GOVT PAYMENT';
  if (combined.includes('TIGOPESA') || combined.includes('TIGO')) return 'MOBILE MONEY';
  if (combined.includes('MPESA') || combined.includes('M-PESA') || combined.includes('VODACOM')) return 'MOBILE MONEY';
  if (combined.includes('AIRTELMONEY') || combined.includes('AIRTEL')) return 'MOBILE MONEY';
  if (combined.includes('HALOPESA') || combined.includes('HALOTEL')) return 'MOBILE MONEY';
  if (combined.includes('DEPOSIT') || combined.includes('C2BMPESA')) return 'DEPOSIT';
  if (combined.includes('AGENCY FT')) return 'AGENCY DEPOSIT';
  if (combined.includes('ESB TIPS')) return 'BANK TRANSFER';
  if (combined.includes('SIMAPP FT') || combined.includes('SIMUSSD FT')) return 'INCOMING TRANSFER';
  if (combined.includes('IB FT FROM') || combined.includes('IB FT TO')) return 'BANK TRANSFER';
  if (combined.includes('MT103')) return 'INTERNATIONAL TRANSFER';
  if (combined.includes('TRANSFER')) return 'TRANSFER';

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

/** Extract text lines from a PDF file */
async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group text items by y-position to form lines
    const lineMap = new Map<number, { x: number; text: string }[]>();
    
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]); // y position
      const x = Math.round(item.transform[4]); // x position
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, text: item.str });
    }

    // Sort lines by y (descending since PDF y is bottom-up), then items by x
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
  
  // Detect bank and account info from early lines
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
  const transactions: ParsedTransaction[] = [];

  // Parse transactions - look for lines starting with date pattern DD.MM.YYYY
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

    // Collect the full transaction text - this line plus continuation lines
    let fullText = line;
    let j = i + 1;
    // Look ahead for continuation lines (lines that don't start with a date)
    while (j < lines.length && !lines[j].match(datePattern)) {
      // Stop if we hit a page header or known non-transaction section
      if (lines[j].match(/^(Transaction Summary|Page|CRDB|CROB|Account Bank|Posting Date|Date)/i)) break;
      fullText += ' ' + lines[j];
      j++;
    }

    // Extract amounts - look for number patterns like 1,234,567.89
    const amountPattern = /[\d,]+\.\d{2}/g;
    const amounts = [...fullText.matchAll(amountPattern)].map(m => m[0]);
    
    // Extract reference
    const refMatch = fullText.match(/REF:[a-f0-9]+|BE [A-Z0-9]+|TZ#[^\s#]+/i);
    const reference = refMatch ? refMatch[0] : '';

    // Remove the date, amounts, and time from description
    let description = fullText
      .replace(datePattern, '')
      .replace(/\d{2}:\d{2}:\d{2}/g, '')
      .replace(/[\d,]+\.\d{2}/g, '')
      .replace(/00:00:00/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Try to determine if it's a debit or credit based on context
    const isDebit = fullText.match(/IB FT FROM|IB FT TO (?!.*FROM)|CHARGE:|VAT.*PAYABLE|SWIFT TRANSFER.*FROM NECTARINE|GePG|SALARY/i);
    const isCredit = fullText.match(/SIMAPP FT.*FROM .* TO NECTARINE|SIMUSSD FT.*FROM|ESB TIPS.*TO\s*$|AGENCY FT|DEPOSIT|MT103|IB FT.*FROM .* TO NECTARINE/i);

    if (amounts.length >= 2) {
      // Typically: debit amount, credit amount (or vice versa), then balance
      const debit = parseAmount(amounts[0]);
      const credit = parseAmount(amounts[1]);
      const balance = amounts.length >= 3 ? parseAmount(amounts[amounts.length - 1]) : 0;

      // Determine the actual amount
      let amount = 0;
      if (debit > 0 && credit === 0) {
        // Check context - some formats have debit first
        amount = isCredit ? debit : -debit;
      } else if (credit > 0 && debit === 0) {
        amount = isDebit ? -credit : credit;
      } else if (debit > 0 && credit > 0) {
        // Both non-zero - the larger one is likely the transaction, smaller is charges
        // Use context clues
        if (isCredit) {
          amount = Math.max(debit, credit);
        } else {
          amount = -Math.max(debit, credit);
        }
      }

      // Skip if amount is 0 (likely a header or malformed line)
      if (amount === 0 && balance === 0) {
        i = j;
        continue;
      }

      const item = categorizeTransaction(reference, description);
      
      transactions.push({
        date: parsedDate,
        reference,
        description: description.substring(0, 200),
        amount,
        balance,
        item,
        paymentAccount: detectedAccount,
      });
    } else if (amounts.length === 1) {
      // Single amount - need context to determine direction
      const amt = parseAmount(amounts[0]);
      if (amt === 0) { i = j; continue; }

      const amount = isDebit ? -amt : amt;
      const item = categorizeTransaction(reference, description);
      
      transactions.push({
        date: parsedDate,
        reference,
        description: description.substring(0, 200),
        amount,
        balance: 0,
        item,
        paymentAccount: detectedAccount,
      });
    }

    i = j;
  }

  return {
    bankName,
    accountNumber,
    currency,
    transactions,
    detectedAccount,
  };
}
