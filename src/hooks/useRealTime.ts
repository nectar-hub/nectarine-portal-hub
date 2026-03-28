import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import type { 
  RealTimeDay, 
  RealTimeEntry, 
  RealTimeEntryRow, 
  DaySummary, 
  PaymentAccount 
} from '@/types/real-time';

// Safe number helper - ensures we never have null/undefined values
const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

export const useRealTime = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch day record for selected date
  const { data: currentDay, isLoading: dayLoading } = useQuery({
    queryKey: ['real-time-day', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_time_days')
        .select('*')
        .eq('op_date', dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as RealTimeDay | null;
    },
  });

  // Fetch entries for the day
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['real-time-entries', currentDay?.id],
    queryFn: async () => {
      if (!currentDay?.id) return [];
      const { data, error } = await supabase
        .from('real_time_entries')
        .select('*')
        .eq('day_id', currentDay.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as RealTimeEntry[];
    },
    enabled: !!currentDay?.id,
  });

  // Calculate opening total (null-safe)
  const openingTotal = useMemo(() => {
    if (!currentDay) return 0;
    return (
      safeNum(currentDay.opening_cash) +
      safeNum(currentDay.opening_nmb_card) +
      safeNum(currentDay.opening_mpesa_271) +
      safeNum(currentDay.opening_crdb) +
      safeNum(currentDay.opening_crdb_usd)
    );
  }, [currentDay]);

  // Transform entries to row format with computed columns
  const entryRows: RealTimeEntryRow[] = useMemo(() => {
    let runningTotal = openingTotal;

    return entries.map((entry) => {
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
  }, [entries, openingTotal]);

  // Calculate day summary
  const daySummary: DaySummary = useMemo(() => {
    const totalInflows = entries.reduce(
      (sum, e) => sum + (safeNum(e.amount) > 0 ? safeNum(e.amount) : 0),
      0
    );
    const totalOutflows = entries.reduce(
      (sum, e) => sum + (safeNum(e.amount) < 0 ? Math.abs(safeNum(e.amount)) : 0),
      0
    );

    // Calculate closing balances per account
    const closingCash = safeNum(currentDay?.opening_cash) +
      entries.filter(e => e.payment_account === 'CASH').reduce((s, e) => s + safeNum(e.amount), 0);
    const closingNmbCard = safeNum(currentDay?.opening_nmb_card) +
      entries.filter(e => e.payment_account === 'NMB_CARD').reduce((s, e) => s + safeNum(e.amount), 0);
    const closingMpesa271 = safeNum(currentDay?.opening_mpesa_271) +
      entries.filter(e => e.payment_account === 'MPESA_271').reduce((s, e) => s + safeNum(e.amount), 0);
    const closingCrdb = safeNum(currentDay?.opening_crdb) +
      entries.filter(e => e.payment_account === 'CRDB').reduce((s, e) => s + safeNum(e.amount), 0);
    const closingCrdbUsd = safeNum(currentDay?.opening_crdb_usd) +
      entries.filter(e => e.payment_account === 'CRDB_USD').reduce((s, e) => s + safeNum(e.amount), 0);

    const closingBalance = closingCash + closingNmbCard + closingMpesa271 + closingCrdb + closingCrdbUsd;

    return {
      totalInflows,
      totalOutflows,
      netMovement: totalInflows - totalOutflows,
      closingBalance,
      closingCash,
      closingNmbCard,
      closingMpesa271,
      closingCrdb,
      closingCrdbUsd,
    };
  }, [entries, currentDay]);

  const getCarryForwardBalances = useCallback(async (beforeDate: string) => {
    const emptyBalances = {
      opening_cash: 0,
      opening_nmb_card: 0,
      opening_mpesa_271: 0,
      opening_crdb: 0,
      opening_crdb_usd: 0,
    };

    const { data: prevDay, error: prevError } = await supabase
      .from('real_time_days')
      .select('*')
      .lt('op_date', beforeDate)
      .order('op_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevError) throw prevError;
    if (!prevDay) return emptyBalances;

    const { data: prevEntries, error: entriesError } = await supabase
      .from('real_time_entries')
      .select('payment_account, amount')
      .eq('day_id', prevDay.id);

    if (entriesError) throw entriesError;

    const sumByAccount = (account: PaymentAccount) =>
      (prevEntries || [])
        .filter((entry) => entry.payment_account === account)
        .reduce((sum, entry) => sum + safeNum(entry.amount), 0);

    return {
      opening_cash: safeNum(prevDay.opening_cash) + sumByAccount('CASH'),
      opening_nmb_card: safeNum(prevDay.opening_nmb_card) + sumByAccount('NMB_CARD'),
      opening_mpesa_271: safeNum(prevDay.opening_mpesa_271) + sumByAccount('MPESA_271'),
      opening_crdb: safeNum(prevDay.opening_crdb) + sumByAccount('CRDB'),
      opening_crdb_usd: safeNum(prevDay.opening_crdb_usd) + sumByAccount('CRDB_USD'),
    };
  }, []);

  // Create new day
  const createDayMutation = useMutation({
    mutationFn: async () => {
      const openingBalances = await getCarryForwardBalances(dateStr);

      const { data, error } = await supabase
        .from('real_time_days')
        .insert({
          op_date: dateStr,
          ...openingBalances,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-time-day', dateStr] });
      toast.success('Day created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create day: ${error.message}`);
    },
  });

  // Copy previous day closing balances
  const copyPreviousDayMutation = useMutation({
    mutationFn: async () => {
      // First check if a previous day exists at all
      const { data: prevDay, error: prevError } = await supabase
        .from('real_time_days')
        .select('id')
        .lt('op_date', dateStr)
        .order('op_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevError) throw prevError;
      if (!prevDay) throw new Error('No previous day found to copy from');

      const carryForwardBalances = await getCarryForwardBalances(dateStr);

      if (currentDay) {
        // Update existing day
        const { error } = await supabase
          .from('real_time_days')
          .update(carryForwardBalances)
          .eq('id', currentDay.id);

        if (error) throw error;
      } else {
        // Create new day with copied balances
        const { error } = await supabase
          .from('real_time_days')
          .insert({
            op_date: dateStr,
            ...carryForwardBalances,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-time-day', dateStr] });
      toast.success('Opening balances copied from previous day');
    },
    onError: (error) => {
      toast.error(`Failed to copy balances: ${error.message}`);
    },
  });

  // Update opening balances
  const updateOpeningBalancesMutation = useMutation({
    mutationFn: async (balances: Partial<RealTimeDay>) => {
      if (!currentDay) throw new Error('No day selected');
      const { error } = await supabase
        .from('real_time_days')
        .update(balances)
        .eq('id', currentDay.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-time-day', dateStr] });
      toast.success('Opening balances updated');
    },
    onError: (error) => {
      toast.error(`Failed to update balances: ${error.message}`);
    },
  });

  // Add entry
  const addEntryMutation = useMutation({
    mutationFn: async (entry: {
      item: string;
      description: string;
      payment_account: PaymentAccount;
      amount: number;
      reference_no?: string;
    }) => {
      if (!currentDay) throw new Error('No day selected');

      const maxSortOrder = entries.length > 0
        ? Math.max(...entries.map((e) => e.sort_order))
        : -1;

      const { data, error } = await supabase
        .from('real_time_entries')
        .insert({
          day_id: currentDay.id,
          ...entry,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-time-entries', currentDay?.id] });
      toast.success('Entry added');
    },
    onError: (error) => {
      toast.error(`Failed to add entry: ${error.message}`);
    },
  });

  // Update entry
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RealTimeEntry> & { id: string }) => {
      const { error } = await supabase
        .from('real_time_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-time-entries', currentDay?.id] });
      toast.success('Entry updated');
    },
    onError: (error) => {
      toast.error(`Failed to update entry: ${error.message}`);
    },
  });

  // Delete entry
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('real_time_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-time-entries', currentDay?.id] });
      toast.success('Entry deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
    },
  });

  return {
    selectedDate,
    setSelectedDate,
    currentDay,
    entries,
    entryRows,
    openingTotal,
    daySummary,
    isLoading: dayLoading || entriesLoading,
    createDay: createDayMutation.mutate,
    copyPreviousDay: copyPreviousDayMutation.mutate,
    updateOpeningBalances: updateOpeningBalancesMutation.mutate,
    addEntry: addEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    isCreatingDay: createDayMutation.isPending,
    isCopyingDay: copyPreviousDayMutation.isPending,
  };
};
