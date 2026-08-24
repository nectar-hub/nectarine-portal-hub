import { useState, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseBankStatement, type ParsedStatement, type ParsedTransaction } from '@/lib/bank-statement-parser';
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_LABELS, type PaymentAccount } from '@/types/real-time';
import { format } from 'date-fns';

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

// Auto-categorize transactions based on description patterns
const CLEARANCE_NUMBERS = ['0777734335', '0713789341', '0677815157', '0682094274'];

const CATEGORY_RULES: { pattern: RegExp; item: string }[] = CLEARANCE_NUMBERS.map((num) => ({
  pattern: new RegExp(num),
  item: 'CLEARANCE',
}));


const categorizeTransaction = (description: string): string => {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) return rule.item;
  }
  return 'TRANSACTION';
};

interface BankStatementImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const BankStatementImportDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: BankStatementImportDialogProps) => {
  const emptyOpeningBalances = {
    opening_cash: 0,
    opening_nmb_card: 0,
    opening_mpesa_271: 0,
    opening_crdb: 0,
    opening_crdb_usd: 0,
  };

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [parsedData, setParsedData] = useState<ParsedStatement | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount>('CRDB');
  const [isParsing, setIsParsing] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{ created: number; appended: number; replaced: number; entries: number }>({ created: 0, appended: 0, replaced: 0, entries: 0 });
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const reset = useCallback(() => {
    setStep('upload');
    setParsedData(null);
    setSelectedAccount('CRDB');
    setIsParsing(false);
    setImportProgress({ current: 0, total: 0 });
    setImportResults({ created: 0, appended: 0, replaced: 0, entries: 0 });
    setSelectedTransactions(new Set());
    setImportMode('replace');
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseBankStatement(file);
      setParsedData(result);
      setSelectedAccount(result.detectedAccount);
      setSelectedTransactions(new Set(result.transactions.map((_, i) => i)));
      setStep('preview');
    } catch (error: any) {
      toast.error(`Failed to parse statement: ${error.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    
    const transactions = parsedData.transactions.filter((_, i) => selectedTransactions.has(i));
    if (transactions.length === 0) {
      toast.error('No transactions selected');
      return;
    }

    setStep('importing');

    // Group transactions by date
    const byDate = new Map<string, ParsedTransaction[]>();
    for (const tx of transactions) {
      if (!byDate.has(tx.date)) byDate.set(tx.date, []);
      byDate.get(tx.date)!.push(tx);
    }

    const dates = [...byDate.keys()].sort();
    const statementStartDate = [...new Set(parsedData.transactions.map((tx) => tx.date))].sort()[0] ?? null;
    setImportProgress({ current: 0, total: dates.length });

    let created = 0, appended = 0, replaced = 0, totalEntries = 0;

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const dayTransactions = byDate.get(dateStr)!;
      setImportProgress({ current: i + 1, total: dates.length });

      // Check if day already exists
      const { data: existingDay } = await supabase
        .from('real_time_days')
        .select('id')
        .eq('op_date', dateStr)
        .maybeSingle();

      let dayId: string;

      // Helper to calculate opening balances from previous day's closing
      const calcOpeningBalances = async (beforeDate: string) => {
        const { data: prevDay } = await supabase
          .from('real_time_days')
          .select('*')
          .lt('op_date', beforeDate)
          .order('op_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!prevDay) {
          if (
            parsedData.statementOpeningBalance !== null &&
            statementStartDate &&
            beforeDate === statementStartDate
          ) {
            return {
              ...emptyOpeningBalances,
              opening_cash: selectedAccount === 'CASH' ? parsedData.statementOpeningBalance : 0,
              opening_nmb_card: selectedAccount === 'NMB_CARD' ? parsedData.statementOpeningBalance : 0,
              opening_mpesa_271: selectedAccount === 'MPESA_271' ? parsedData.statementOpeningBalance : 0,
              opening_crdb: selectedAccount === 'CRDB' ? parsedData.statementOpeningBalance : 0,
              opening_crdb_usd: selectedAccount === 'CRDB_USD' ? parsedData.statementOpeningBalance : 0,
            };
          }

          return emptyOpeningBalances;
        }

        const { data: prevEntries } = await supabase
          .from('real_time_entries')
          .select('payment_account, amount')
          .eq('day_id', prevDay.id);

        const sumByAccount = (account: string) =>
          (prevEntries || [])
            .filter((e) => e.payment_account === account)
            .reduce((s, e) => s + safeNum(e.amount), 0);

        return {
          opening_cash: safeNum(prevDay.opening_cash) + sumByAccount('CASH'),
          opening_nmb_card: safeNum(prevDay.opening_nmb_card) + sumByAccount('NMB_CARD'),
          opening_mpesa_271: safeNum(prevDay.opening_mpesa_271) + sumByAccount('MPESA_271'),
          opening_crdb: safeNum(prevDay.opening_crdb) + sumByAccount('CRDB'),
          opening_crdb_usd: safeNum(prevDay.opening_crdb_usd) + sumByAccount('CRDB_USD'),
        };
      };

      if (existingDay) {
        dayId = existingDay.id;
        if (importMode === 'replace') {
          // Delete only entries for the selected payment account, not all entries
          await supabase
            .from('real_time_entries')
            .delete()
            .eq('day_id', dayId)
            .eq('payment_account', selectedAccount);

          const openingBalances = await calcOpeningBalances(dateStr);
          await supabase
            .from('real_time_days')
            .update(openingBalances)
            .eq('id', dayId);

          replaced++;
        } else {
          appended++;
        }
      } else {
        const openingBalances = await calcOpeningBalances(dateStr);

        const { data: newDay, error: dayError } = await supabase
          .from('real_time_days')
          .insert({
            op_date: dateStr,
            ...openingBalances,
            notes: `Imported from ${parsedData.bankName} statement`,
          })
          .select()
          .single();

        if (dayError) {
          console.error(`Failed to create day ${dateStr}:`, dayError);
          continue;
        }

        dayId = newDay.id;
        created++;
      }

      // Get current max sort_order for this day
      const { data: existingEntries } = await supabase
        .from('real_time_entries')
        .select('sort_order')
        .eq('day_id', dayId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const startOrder = (existingEntries?.[0]?.sort_order ?? -1) + 1;

      const entries = dayTransactions.map((tx, idx) => ({
        day_id: dayId,
        item: categorizeTransaction(tx.description),
        description: tx.description,
        payment_account: selectedAccount,
        amount: tx.amount,
        reference_no: tx.referenceNo || null,
        sort_order: startOrder + idx,
      }));

      const { error: entriesError } = await supabase
        .from('real_time_entries')
        .insert(entries);

      if (entriesError) {
        console.error(`Failed to insert entries for ${dateStr}:`, entriesError);
      } else {
        totalEntries += entries.length;
      }
    }

    setImportResults({ created, appended, replaced, entries: totalEntries });
    setStep('done');
  };

  const toggleAll = () => {
    if (!parsedData) return;
    if (selectedTransactions.size === parsedData.transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(parsedData.transactions.map((_, i) => i)));
    }
  };

  const toggleTransaction = (idx: number) => {
    const next = new Set(selectedTransactions);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedTransactions(next);
  };

  const handleClose = () => {
    if (step === 'done') {
      onImportComplete();
    }
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  // Group transactions by date for preview
  const transactionsByDate = parsedData?.transactions.reduce<Record<string, { idx: number; tx: ParsedTransaction }[]>>(
    (acc, tx, idx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push({ idx, tx });
      return acc;
    },
    {}
  ) ?? {};

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Bank Statement
          </DialogTitle>
          <DialogDescription>
            Upload a PDF to import transactions. Item labels default to "TRANSACTION" for manual editing.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {isParsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Parsing statement...</p>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Click to upload bank statement</p>
                    <p className="text-sm text-muted-foreground">Supports CRDB, NMB PDF statements</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {step === 'preview' && parsedData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Bank</p>
                <p className="font-semibold">{parsedData.bankName}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="font-semibold">{parsedData.transactions.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Days</p>
                <p className="font-semibold">{Object.keys(transactionsByDate).length}</p>
              </div>
            </div>

            {parsedData.statementClosingBalance !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Statement opening</p>
                  <p className="font-semibold">
                    {parsedData.statementOpeningBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Statement closing</p>
                  <p className="font-semibold">
                    {parsedData.statementClosingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">Payment Account:</Label>
              <Select
                value={selectedAccount}
                onValueChange={(v: PaymentAccount) => setSelectedAccount(v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_ACCOUNTS.map((acc) => (
                    <SelectItem key={acc} value={acc}>
                      {PAYMENT_ACCOUNT_LABELS[acc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">Import Mode:</Label>
              <Select
                value={importMode}
                onValueChange={(v: 'replace' | 'append') => setImportMode(v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">Replace existing</SelectItem>
                  <SelectItem value="append">Append to existing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {importMode === 'replace' ? (
                  <>New days will be created automatically. Existing entries on imported days will be <strong>cleared and replaced</strong>. Item labels default to "TRANSACTION".</>
                ) : (
                  <>New days will be created automatically. Existing days will have entries <strong>appended</strong>. Item labels default to "TRANSACTION".</>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTransactions.size === parsedData.transactions.length}
                onCheckedChange={toggleAll}
              />
              <Label className="text-sm cursor-pointer" onClick={toggleAll}>
                Select All ({selectedTransactions.size}/{parsedData.transactions.length})
              </Label>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-3 space-y-4">
                {Object.entries(transactionsByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, items]) => (
                    <div key={date}>
                      <h4 className="font-semibold text-sm mb-2 sticky top-0 bg-background py-1">
                        {format(new Date(date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {items.length} entries
                        </Badge>
                      </h4>
                      <div className="space-y-1 pl-2">
                        {items.map(({ idx, tx }) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs py-1.5 border-b border-border/50"
                          >
                            <Checkbox
                              checked={selectedTransactions.has(idx)}
                              onCheckedChange={() => toggleTransaction(idx)}
                            />
                            <span className="truncate flex-1 text-muted-foreground">
                              {tx.description}
                            </span>
                            <span
                              className={`font-mono shrink-0 font-medium ${
                                tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {tx.amount >= 0 ? '+' : ''}
                              {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={selectedTransactions.size === 0}>
                Import {selectedTransactions.size} Transactions
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="font-medium">
              Importing day {importProgress.current} of {importProgress.total}...
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-4">
            <Check className="h-10 w-10 text-green-600 mx-auto" />
            <p className="font-medium text-lg">Import Complete!</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResults.created}</p>
                <p className="text-xs text-muted-foreground">Days Created</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{importResults.entries}</p>
                <p className="text-xs text-muted-foreground">Entries Added</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{importResults.replaced}</p>
                <p className="text-xs text-muted-foreground">Days Replaced</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-muted-foreground">{importResults.appended}</p>
                <p className="text-xs text-muted-foreground">Days Appended</p>
              </div>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
