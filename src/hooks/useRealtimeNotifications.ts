import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('[REALTIME NOTIFICATIONS] Setting up notification subscriptions for user:', user.id);

    // Listen for status changes on buy requests
    const buyRequestsNotificationChannel = supabase
      .channel('buy_requests_status_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buy_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[REALTIME NOTIFICATIONS] Buy request updated:', payload);
          
          if (payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            const productName = payload.new.product_name;

            if (oldStatus !== newStatus) {
              toast({
                title: "Request Status Updated",
                description: `Your "${productName}" request has been ${newStatus}`,
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for status changes on self purchases
    const selfPurchasesNotificationChannel = supabase
      .channel('self_purchases_status_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'self_purchases',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[REALTIME NOTIFICATIONS] Self purchase updated:', payload);
          
          if (payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            const description = payload.new.description;

            if (oldStatus !== newStatus) {
              toast({
                title: "Self Purchase Status Updated",
                description: `Your "${description}" has been ${newStatus}`,
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for order status changes
    const ordersNotificationChannel = supabase
      .channel('orders_status_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[REALTIME NOTIFICATIONS] Order updated:', payload);
          
          if (payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;

            if (oldStatus !== newStatus) {
              toast({
                title: "Order Status Updated",
                description: `Your order status has been updated to ${newStatus}`,
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(buyRequestsNotificationChannel);
      supabase.removeChannel(selfPurchasesNotificationChannel);
      supabase.removeChannel(ordersNotificationChannel);
    };
  }, [user]);
}