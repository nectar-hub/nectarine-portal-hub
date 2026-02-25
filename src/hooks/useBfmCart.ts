import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { BfmCartItem } from '@/types/bfm';

export const useBfmCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['bfm_cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bfm_cart_items' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BfmCartItem[];
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<BfmCartItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bfm_cart_items' as any)
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_cart'] });
      toast({ title: 'Added to Cart', description: 'Item added to your Nectarine Cart' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BfmCartItem> & { id: string }) => {
      const { error } = await supabase
        .from('bfm_cart_items' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_cart'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bfm_cart_items' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_cart'] });
      toast({ title: 'Removed', description: 'Item removed from cart' });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('bfm_cart_items' as any)
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_cart'] });
    },
  });

  const cartTotal = (cartQuery.data || []).reduce((sum, item) => {
    const lineTotal = (item.unit_price || 0) * item.quantity + item.estimated_tax + item.estimated_shipping;
    return sum + lineTotal;
  }, 0);

  const cartCount = (cartQuery.data || []).reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartQuery.data || [],
    isLoading: cartQuery.isLoading,
    cartTotal,
    cartCount,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refetch: cartQuery.refetch,
  };
};
