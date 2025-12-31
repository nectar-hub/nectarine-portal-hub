import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExchangeRate, ExchangeRateFormData, ConversionResult } from '@/types/currency';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useExchangeRates() {
  const queryClient = useQueryClient();

  const { data: exchangeRates, isLoading, error } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('effective_from', { ascending: false });
      
      if (error) throw error;
      return data as ExchangeRate[];
    },
  });

  const createRate = useMutation({
    mutationFn: async (data: ExchangeRateFormData) => {
      const { data: result, error } = await supabase
        .from('exchange_rates')
        .insert({
          base_currency: data.base_currency,
          quote_currency: data.quote_currency,
          rate: data.rate,
          effective_from: format(data.effective_from, 'yyyy-MM-dd'),
          effective_to: data.effective_to ? format(data.effective_to, 'yyyy-MM-dd') : null,
          source: data.source || 'manual',
          notes: data.notes || null,
          is_active: data.is_active,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Exchange rate created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create exchange rate: ${error.message}`);
    },
  });

  const updateRate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExchangeRateFormData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.base_currency !== undefined) updateData.base_currency = data.base_currency;
      if (data.quote_currency !== undefined) updateData.quote_currency = data.quote_currency;
      if (data.rate !== undefined) updateData.rate = data.rate;
      if (data.effective_from !== undefined) updateData.effective_from = format(data.effective_from, 'yyyy-MM-dd');
      if (data.effective_to !== undefined) updateData.effective_to = data.effective_to ? format(data.effective_to, 'yyyy-MM-dd') : null;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { data: result, error } = await supabase
        .from('exchange_rates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Exchange rate updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update exchange rate: ${error.message}`);
    },
  });

  const deleteRate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exchange_rates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Exchange rate deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete exchange rate: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data: result, error } = await supabase
        .from('exchange_rates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Exchange rate status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update exchange rate: ${error.message}`);
    },
  });

  // Utility function to get rate for a specific pair and date
  const getRate = async (
    baseCurrency: string,
    quoteCurrency: string,
    date: Date = new Date()
  ): Promise<number | null> => {
    if (baseCurrency === quoteCurrency) return 1;

    const { data, error } = await supabase.rpc('get_exchange_rate', {
      p_base_currency: baseCurrency,
      p_quote_currency: quoteCurrency,
      p_date: format(date, 'yyyy-MM-dd'),
    });

    if (error) {
      console.error('Error getting exchange rate:', error);
      return null;
    }

    return data;
  };

  // Utility function to convert amount between currencies
  const convertAmount = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date = new Date()
  ): Promise<ConversionResult | null> => {
    const rate = await getRate(fromCurrency, toCurrency, date);
    
    if (rate === null) return null;

    // Get base currency
    const { data: baseCurrencyData } = await supabase
      .from('currencies')
      .select('code')
      .eq('is_base', true)
      .maybeSingle();

    const baseCurrency = baseCurrencyData?.code || 'USD';
    let baseEquivalent: number | null = null;

    if (toCurrency !== baseCurrency) {
      const baseRate = await getRate(fromCurrency, baseCurrency, date);
      if (baseRate !== null) {
        baseEquivalent = amount * baseRate;
      }
    }

    return {
      original_amount: amount,
      original_currency: fromCurrency,
      converted_amount: amount * rate,
      target_currency: toCurrency,
      rate_used: rate,
      rate_date: format(date, 'yyyy-MM-dd'),
      base_equivalent: toCurrency === baseCurrency ? amount * rate : baseEquivalent,
      base_currency: baseCurrency,
    };
  };

  return {
    exchangeRates,
    isLoading,
    error,
    createRate: createRate.mutate,
    updateRate: updateRate.mutate,
    deleteRate: deleteRate.mutate,
    toggleActive: toggleActive.mutate,
    isCreating: createRate.isPending,
    isUpdating: updateRate.isPending,
    isDeleting: deleteRate.isPending,
    getRate,
    convertAmount,
  };
}
