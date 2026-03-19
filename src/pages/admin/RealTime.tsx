import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { RealTimeDaySelector } from '@/components/real-time/RealTimeDaySelector';
import { RealTimeOpeningBalances } from '@/components/real-time/RealTimeOpeningBalances';
import { RealTimeGrid } from '@/components/real-time/RealTimeGrid';
import { RealTimeSummary } from '@/components/real-time/RealTimeSummary';
import { RealTimeMonthlyReports } from '@/components/real-time/RealTimeMonthlyReports';
import { BankStatementImportDialog } from '@/components/real-time/BankStatementImportDialog';
import { useRealTime } from '@/hooks/useRealTime';
import { exportDayToXLSX, exportMonthToXLSX } from '@/lib/real-time-export';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import type { RealTimeDay, RealTimeEntry, RealTimeEntryRow, DaySummary } from '@/types/real-time';
import { Loader2, Clock, CalendarDays, BarChart3, Lock } from 'lucide-react';

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

const RealTime = () => {
  const { isSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const {
    selectedDate,
    setSelectedDate,
    currentDay,
    entryRows,
    openingTotal,
    daySummary,
    isLoading,
    createDay,
    copyPreviousDay,
    updateOpeningBalances,
    addEntry,
    updateEntry,
    deleteEntry,
    isCreatingDay,
    isCopyingDay,
  } = useRealTime();

  const handleExportDay = () => {
    if (!currentDay) {
      toast.error('No day to export');
      return;
    }
    exportDayToXLSX(currentDay, entryRows, openingTotal, daySummary);
    toast.success('Day exported successfully');
  };

  const handleExportMonth = async () => {
    if (!currentDay) {
      toast.error('No day selected');
      return;
    }

    try {
      const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      // Fetch all days in the month
      const { data: days, error: daysError } = await supabase
        .from('real_time_days')
        .select('*')
        .gte('op_date', monthStart)
        .lte('op_date', monthEnd)
        .order('op_date', { ascending: true });

      if (daysError) throw daysError;
      if (!days || days.length === 0) {
        toast.error('No days found for this month');
        return;
      }

      // Fetch entries for all days
      const dayIds = days.map((d) => d.id);
      const { data: allEntries, error: entriesError } = await supabase
        .from('real_time_entries')
        .select('*')
        .in('day_id', dayIds)
        .order('sort_order', { ascending: true });

      if (entriesError) throw entriesError;

      // Build export data
      const exportData = days.map((day) => {
        const dayEntries = (allEntries || []).filter((e) => e.day_id === day.id) as RealTimeEntry[];
        
        const dayOpeningTotal =
          safeNum(day.opening_cash) +
          safeNum(day.opening_nmb_card) +
          safeNum(day.opening_mpesa_271) +
          safeNum(day.opening_crdb) +
          safeNum(day.opening_crdb_usd);

        let runningTotal = dayOpeningTotal;
        const entryRowsForDay: RealTimeEntryRow[] = dayEntries.map((entry) => {
          const amount = safeNum(entry.amount);
          runningTotal += amount;
          return {
            ...entry,
            cash_col: entry.payment_account === 'CASH' ? amount : null,
            nmb_card_col: entry.payment_account === 'NMB_CARD' ? amount : null,
            mpesa_271_col: entry.payment_account === 'MPESA_271' ? amount : null,
            crdb_col: entry.payment_account === 'CRDB' ? amount : null,
            crdb_usd_col: entry.payment_account === 'CRDB_USD' ? amount : null,
            running_total: runningTotal,
          };
        });

        const totalInflows = dayEntries.reduce(
          (sum, e) => sum + (safeNum(e.amount) > 0 ? safeNum(e.amount) : 0),
          0
        );
        const totalOutflows = dayEntries.reduce(
          (sum, e) => sum + (safeNum(e.amount) < 0 ? Math.abs(safeNum(e.amount)) : 0),
          0
        );

        const closingCash = safeNum(day.opening_cash) +
          dayEntries.filter(e => e.payment_account === 'CASH').reduce((s, e) => s + safeNum(e.amount), 0);
        const closingNmbCard = safeNum(day.opening_nmb_card) +
          dayEntries.filter(e => e.payment_account === 'NMB_CARD').reduce((s, e) => s + safeNum(e.amount), 0);
        const closingMpesa271 = safeNum(day.opening_mpesa_271) +
          dayEntries.filter(e => e.payment_account === 'MPESA_271').reduce((s, e) => s + safeNum(e.amount), 0);
        const closingCrdb = safeNum(day.opening_crdb) +
          dayEntries.filter(e => e.payment_account === 'CRDB').reduce((s, e) => s + safeNum(e.amount), 0);
        const closingCrdbUsd = safeNum(day.opening_crdb_usd) +
          dayEntries.filter(e => e.payment_account === 'CRDB_USD').reduce((s, e) => s + safeNum(e.amount), 0);

        const summary: DaySummary = {
          totalInflows,
          totalOutflows,
          netMovement: totalInflows - totalOutflows,
          closingBalance: closingCash + closingNmbCard + closingMpesa271 + closingCrdb + closingCrdbUsd,
          closingCash,
          closingNmbCard,
          closingMpesa271,
          closingCrdb,
          closingCrdbUsd,
        };

        return {
          day: day as RealTimeDay,
          entries: entryRowsForDay,
          openingTotal: dayOpeningTotal,
          summary,
        };
      });

      await exportMonthToXLSX(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        exportData
      );

      toast.success('Month exported successfully');
    } catch (error: any) {
      toast.error(`Failed to export month: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Real Time</h1>
            <p className="text-muted-foreground">Track daily operational costs and cash movements</p>
          </div>
        </div>

        <Tabs defaultValue={isSuperadmin ? "daily" : "reports"} className="w-full">
          <TabsList>
            {isSuperadmin && (
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Daily Entry
              </TabsTrigger>
            )}
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monthly Reports
            </TabsTrigger>
          </TabsList>

          {!isSuperadmin && (
            <Alert className="mt-4 mb-2">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Daily entry management is restricted to superadmins. You can view Monthly Reports.
              </AlertDescription>
            </Alert>
          )}

          {isSuperadmin && (
            <TabsContent value="daily" className="space-y-6 mt-6">
              <RealTimeDaySelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                hasDay={!!currentDay}
                onCreateDay={() => createDay()}
                onCopyPreviousDay={() => copyPreviousDay()}
                onExportDay={handleExportDay}
                onExportMonth={handleExportMonth}
                onImportStatement={() => setShowImportDialog(true)}
                isCreatingDay={isCreatingDay}
                isCopyingDay={isCopyingDay}
              />

              <RealTimeOpeningBalances
                day={currentDay}
                openingTotal={openingTotal}
                onUpdateBalances={updateOpeningBalances}
              />

              <RealTimeGrid
                day={currentDay}
                entries={entryRows}
                openingTotal={openingTotal}
                onAddEntry={addEntry}
                onUpdateEntry={updateEntry}
                onDeleteEntry={deleteEntry}
              />

              <RealTimeSummary
                summary={daySummary}
                hasDay={!!currentDay}
              />
            </TabsContent>
          )}

          <TabsContent value="reports" className="mt-6">
            <RealTimeMonthlyReports />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RealTime;
