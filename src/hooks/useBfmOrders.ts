import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { BfmOrder, BfmCartItem, BfmOrderStatus, BfmPaymentStatus } from '@/types/bfm';

export const useBfmOrders = (adminMode = false) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['bfm_orders', adminMode, user?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('bfm_orders' as any)
        .select('*, items:bfm_order_items(*)')
        .order('created_at', { ascending: false });
      
      if (!adminMode) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // If admin mode, fetch user profiles
      if (adminMode && data && data.length > 0) {
        const userIds = [...new Set((data as any[]).map((o: any) => o.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        return (data as any[]).map((order: any) => {
          const profile = profileMap.get(order.user_id);
          return {
            ...order,
            user_email: profile?.email || '',
            user_name: profile?.full_name || '',
          };
        }) as BfmOrder[];
      }

      return (data || []) as unknown as BfmOrder[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (cartItems: BfmCartItem[]) => {
      if (!user || cartItems.length === 0) throw new Error('No items');

      const subtotal = cartItems.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0);
      const totalTax = cartItems.reduce((s, i) => s + i.estimated_tax, 0);
      const totalShipping = cartItems.reduce((s, i) => s + i.estimated_shipping, 0);
      const totalRegulatoryFees = cartItems.reduce((s, i) => s + (i.estimated_regulatory_fees || 0), 0);
      const grandTotal = subtotal + totalTax + totalShipping + totalRegulatoryFees;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('bfm_orders' as any)
        .insert({
          user_id: user.id,
          order_number: 'temp', // trigger will set it
          status: 'AWAITING_PAYMENT',
          payment_method: 'OFFLINE',
          payment_status: 'UNPAID',
          currency: cartItems[0].currency || 'USD',
          subtotal,
          total_tax: totalTax,
          total_shipping: totalShipping,
          grand_total: grandTotal,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: (order as any).id,
        store_name: item.store_name,
        product_url: item.product_url,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        variant_color: item.variant_color,
        variant_size: item.variant_size,
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        currency: item.currency,
        tax: item.estimated_tax,
        shipping: item.estimated_shipping,
        regulatory_fees: item.estimated_regulatory_fees || 0,
        line_total: (item.unit_price || 0) * item.quantity + item.estimated_tax + item.estimated_shipping + (item.estimated_regulatory_fees || 0),
      }));

      const { error: itemsError } = await supabase
        .from('bfm_order_items' as any)
        .insert(orderItems as any);

      if (itemsError) throw itemsError;

      // Clear cart
      await supabase
        .from('bfm_cart_items' as any)
        .delete()
        .eq('user_id', user.id);

      return order as unknown as BfmOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_orders'] });
      queryClient.invalidateQueries({ queryKey: ['bfm_cart'] });
      toast({ title: 'Order Created', description: 'Your Buy For Me order has been submitted!' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, adminNotes }: { orderId: string; status: BfmOrderStatus; adminNotes?: string }) => {
      const updates: any = { status };
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;
      if (status === 'PAID') updates.payment_status = 'PAID';
      
      const { error } = await supabase
        .from('bfm_orders' as any)
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_orders'] });
      toast({ title: 'Updated', description: 'Order status updated' });
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('bfm_orders' as any)
        .update({ payment_status: 'PAID', status: 'PAID' } as any)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bfm_orders'] });
      toast({ title: 'Payment Confirmed', description: 'Payment has been confirmed' });
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    createOrder,
    updateOrderStatus,
    confirmPayment,
    refetch: ordersQuery.refetch,
  };
};
