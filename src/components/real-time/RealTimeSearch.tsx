import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, subYears, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2, TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react';
import type { PaymentAccount, RealTimeEntry, RealTimeDay } from '@/types/real-time';
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_LABELS } from '@/types/real-time';

type RangePreset = 'this_month' | 'last_month' | 'last_3_months' | 'last_12_months' | 'ytd' | 'custom';

const safeNum = (v: number | null | undefined) => (v == null || isNaN(Number(v)) ? 0 : Number(v));
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const getRange = (preset: RangePreset, customFrom?: Date, customTo?: Date): { from: Date; to: Date } => {
  const now = new Date();
  switch (preset) {
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last_month': {
      const m = subMonths(now, 1);
      return { from: startOfMonth(m), to: endOfMonth(m) };
    }
    case 'last_3_months':
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case 'last_12_months':
      return { from: startOfMonth(subMonths(now, 11)), to: endOfMonth(now) };
    case 'ytd':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom':
      return {
        from: customFrom || startOfMonth(now),
        to: customTo || endOfMonth(now),
      };
  }
};

export const RealTimeSearch = () => {
  const [preset, setPreset] = useState<RangePreset>('this_month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [customTo, setCustomTo] = useState<Date | undefined>(endOfMonth(new Date()));
  const [query, setQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<PaymentAccount | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflows' | 'outflows'>('all');

  const { from, to } = useMemo(
    () => getRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['real-time-search', fromStr, toStr],
    queryFn: async () => {
      const { data: days, error: daysErr } = await supabase
        .from('real_time_days')
        .select('id, op_date')
        .gte('op_date', fromStr)
        .lte('op_date', toStr);
      if (daysErr) throw daysErr;
      if (!days || days.length === 0) return { entries: [], dayMap: {} as Record<string, string> };

      const dayMap: Record<string, string> = {};
      days.forEach((d) => (dayMap[d.id] = d.op_date));

      const { data: entries, error: entriesErr } = await supabase
        .from('real_time_entries')
        .select('*')
        .in('day_id', days.map((d) => d.id))
        .order('created_at', { ascending: false });
      if (entriesErr) throw entriesErr;

      return { entries: (entries || []) as RealTimeEntry[], dayMap };
    },
  });

  const filtered = useMemo(() => {
    const list = data?.entries || [];
    const q = query.trim().toLowerCase();
    return list.filter((e) => {
      if (accountFilter !== 'all' && e.payment_account !== accountFilter) return false;
      const amt = safeNum(e.amount);
      if (typeFilter === 'inflows' && amt <= 0) return false;
      if (typeFilter === 'outflows' && amt >= 0) return false;
      if (q) {
        const hay = `${e.item || ''} ${e.description || ''} ${e.reference_no || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, query, accountFilter, typeFilter]);

  const totals = useMemo(() => {
    let inflows = 0;
    let outflows = 0;
    filtered.forEach((e) => {
      const amt = safeNum(e.amount);
      if (amt > 0) inflows += amt;
      else outflows += Math.abs(amt);
    });
    return { inflows, outflows, net: inflows - outflows };
  }, [filtered]);

  const clearFilters = () => {
    setQuery('');
    setAccountFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Search Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preset === 'custom' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">From</label>
                  <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="Start date" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">To</label>
                  <DatePicker value={customTo} onChange={setCustomTo} placeholder="End date" />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment Account</label>
              <Select value={accountFilter} onValueChange={(v) => setAccountFilter(v as PaymentAccount | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {PAYMENT_ACCOUNTS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {PAYMENT_ACCOUNT_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="inflows">Inflows (+)</SelectItem>
                  <SelectItem value="outflows">Outflows (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by item, description, or reference..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" /> Clear
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Range: {format(from, 'MMM d, yyyy')} → {format(to, 'MMM d, yyyy')}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inflows</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(totals.inflows)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outflows</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(totals.outflows)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.net >= 0 ? '+' : ''}
              {fmt(totals.net)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results</CardTitle>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No transactions match your filters.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const amt = safeNum(e.amount);
                    const date = data?.dayMap[e.day_id];
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">
                          {date ? format(new Date(date), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell className="font-medium">{e.item}</TableCell>
                        <TableCell className="max-w-[280px] truncate" title={e.description}>
                          {e.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{PAYMENT_ACCOUNT_LABELS[e.payment_account]}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.reference_no || '—'}</TableCell>
                        <TableCell className={`text-right font-medium ${amt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {amt >= 0 ? '+' : ''}
                          {fmt(amt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
