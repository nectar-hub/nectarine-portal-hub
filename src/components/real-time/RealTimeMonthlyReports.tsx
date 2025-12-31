import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { PAYMENT_ACCOUNT_LABELS, PaymentAccount, PAYMENT_ACCOUNTS } from '@/types/real-time';

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface MonthlyAccountSummary {
  account: PaymentAccount;
  label: string;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netMovement: number;
  closingBalance: number;
}

interface MonthlyReport {
  totalInflows: number;
  totalOutflows: number;
  netMovement: number;
  operationalDays: number;
  accountSummaries: MonthlyAccountSummary[];
}

export const RealTimeMonthlyReports = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['real-time-monthly-report', monthStart, monthEnd],
    queryFn: async (): Promise<MonthlyReport> => {
      // Fetch all days in the month
      const { data: days, error: daysError } = await supabase
        .from('real_time_days')
        .select('*')
        .gte('op_date', monthStart)
        .lte('op_date', monthEnd)
        .order('op_date', { ascending: true });

      if (daysError) throw daysError;

      if (!days || days.length === 0) {
        return {
          totalInflows: 0,
          totalOutflows: 0,
          netMovement: 0,
          operationalDays: 0,
          accountSummaries: PAYMENT_ACCOUNTS.map((account) => ({
            account,
            label: PAYMENT_ACCOUNT_LABELS[account],
            openingBalance: 0,
            totalInflows: 0,
            totalOutflows: 0,
            netMovement: 0,
            closingBalance: 0,
          })),
        };
      }

      const dayIds = days.map((d) => d.id);
      const { data: allEntries, error: entriesError } = await supabase
        .from('real_time_entries')
        .select('*')
        .in('day_id', dayIds);

      if (entriesError) throw entriesError;

      const entries = allEntries || [];
      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      const lastDayEntries = entries.filter((e) => e.day_id === lastDay.id);

      // Calculate totals across all entries
      const totalInflows = entries.reduce(
        (sum, e) => sum + (safeNum(e.amount) > 0 ? safeNum(e.amount) : 0),
        0
      );
      const totalOutflows = entries.reduce(
        (sum, e) => sum + (safeNum(e.amount) < 0 ? Math.abs(safeNum(e.amount)) : 0),
        0
      );

      // Calculate per-account summaries
      const accountSummaries: MonthlyAccountSummary[] = PAYMENT_ACCOUNTS.map((account) => {
        const accountKey = `opening_${account.toLowerCase()}` as keyof typeof firstDay;
        const openingBalance = safeNum(firstDay[accountKey] as number);

        const accountEntries = entries.filter((e) => e.payment_account === account);
        const accountInflows = accountEntries.reduce(
          (sum, e) => sum + (safeNum(e.amount) > 0 ? safeNum(e.amount) : 0),
          0
        );
        const accountOutflows = accountEntries.reduce(
          (sum, e) => sum + (safeNum(e.amount) < 0 ? Math.abs(safeNum(e.amount)) : 0),
          0
        );

        // Closing balance = last day opening + all entries for that account on last day
        const lastDayOpeningKey = `opening_${account.toLowerCase()}` as keyof typeof lastDay;
        const lastDayOpening = safeNum(lastDay[lastDayOpeningKey] as number);
        const lastDayAccountEntries = lastDayEntries.filter((e) => e.payment_account === account);
        const closingBalance = lastDayOpening + lastDayAccountEntries.reduce((s, e) => s + safeNum(e.amount), 0);

        return {
          account,
          label: PAYMENT_ACCOUNT_LABELS[account],
          openingBalance,
          totalInflows: accountInflows,
          totalOutflows: accountOutflows,
          netMovement: accountInflows - accountOutflows,
          closingBalance,
        };
      });

      return {
        totalInflows,
        totalOutflows,
        netMovement: totalInflows - totalOutflows,
        operationalDays: days.length,
        accountSummaries,
      };
    },
  });

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => addMonths(prev, 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const report = reportData || {
    totalInflows: 0,
    totalOutflows: 0,
    netMovement: 0,
    operationalDays: 0,
    accountSummaries: [],
  };

  const totalOpeningBalance = report.accountSummaries.reduce((s, a) => s + a.openingBalance, 0);
  const totalClosingBalance = report.accountSummaries.reduce((s, a) => s + a.closingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {format(selectedMonth, 'MMMM yyyy')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {report.operationalDays} operational day{report.operationalDays !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inflows</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(report.totalInflows)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outflows</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(report.totalOutflows)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Movement</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${report.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.netMovement >= 0 ? '+' : ''}{formatCurrency(report.netMovement)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalClosingBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Account</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Inflows</TableHead>
                  <TableHead className="text-right">Outflows</TableHead>
                  <TableHead className="text-right">Net Movement</TableHead>
                  <TableHead className="text-right">Closing Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.accountSummaries.map((summary) => (
                  <TableRow key={summary.account}>
                    <TableCell className="font-medium">{summary.label}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summary.openingBalance)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      +{formatCurrency(summary.totalInflows)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(summary.totalOutflows)}
                    </TableCell>
                    <TableCell className={`text-right ${summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.netMovement >= 0 ? '+' : ''}{formatCurrency(summary.netMovement)}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(summary.closingBalance)}</TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalOpeningBalance)}</TableCell>
                  <TableCell className="text-right text-green-600">+{formatCurrency(report.totalInflows)}</TableCell>
                  <TableCell className="text-right text-red-600">-{formatCurrency(report.totalOutflows)}</TableCell>
                  <TableCell className={`text-right ${report.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.netMovement >= 0 ? '+' : ''}{formatCurrency(report.netMovement)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(totalClosingBalance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
