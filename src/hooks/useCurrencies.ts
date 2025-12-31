import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency, CurrencyFormData } from '@/types/currency';
import { toast } from 'sonner';

export function useCurrencies() {
  const queryClient = useQueryClient();

  const { data: currencies, isLoading, error } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data as Currency[];
    },
  });

  const { data: baseCurrency } = useQuery({
    queryKey: ['currencies', 'base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_base', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as Currency | null;
    },
  });

  const { data: activeCurrencies } = useQuery({
    queryKey: ['currencies', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');
      
      if (error) throw error;
      return data as Currency[];
    },
  });

  const createCurrency = useMutation({
    mutationFn: async (data: CurrencyFormData) => {
      const { data: result, error } = await supabase
        .from('currencies')
        .insert({
          code: data.code.toUpperCase(),
          name: data.name,
          symbol: data.symbol,
          decimal_places: data.decimal_places,
          is_active: data.is_active,
          is_base: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create currency: ${error.message}`);
    },
  });

  const updateCurrency = useMutation({
    mutationFn: async ({ code, ...data }: Partial<CurrencyFormData> & { code: string }) => {
      const { data: result, error } = await supabase
        .from('currencies')
        .update(data)
        .eq('code', code)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update currency: ${error.message}`);
    },
  });

  const deleteCurrency = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('code', code);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete currency: ${error.message}`);
    },
  });

  const setBaseCurrency = useMutation({
    mutationFn: async (code: string) => {
      // First, unset current base currency
      const { error: unsetError } = await supabase
        .from('currencies')
        .update({ is_base: false })
        .eq('is_base', true);
      
      if (unsetError) throw unsetError;

      // Then set new base currency
      const { data: result, error } = await supabase
        .from('currencies')
        .update({ is_base: true })
        .eq('code', code)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Base currency updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set base currency: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ code, is_active }: { code: string; is_active: boolean }) => {
      const { data: result, error } = await supabase
        .from('currencies')
        .update({ is_active })
        .eq('code', code)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update currency: ${error.message}`);
    },
  });

  return {
    currencies,
    activeCurrencies,
    baseCurrency,
    isLoading,
    error,
    createCurrency: createCurrency.mutate,
    updateCurrency: updateCurrency.mutate,
    deleteCurrency: deleteCurrency.mutate,
    setBaseCurrency: setBaseCurrency.mutate,
    toggleActive: toggleActive.mutate,
    isCreating: createCurrency.isPending,
    isUpdating: updateCurrency.isPending,
    isDeleting: deleteCurrency.isPending,
  };
}
