import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentActivityItem {
  id: string;
  type: 'buy_request' | 'self_purchase';
  title: string;
  status: string;
  created_at: string;
}

export function useRecentActivity(userId?: string, isAdmin?: boolean) {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const buyQuery = supabase
          .from('buy_requests')
          .select('id, product_name, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        const selfQuery = supabase
          .from('self_purchases')
          .select('id, description, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        if (userId) {
          buyQuery.eq('user_id', userId);
          selfQuery.eq('user_id', userId);
        }

        const [buyRes, selfRes] = await Promise.all([buyQuery, selfQuery]);

        const items: RecentActivityItem[] = [
          ...(buyRes.data || []).map((r) => ({
            id: r.id,
            type: 'buy_request' as const,
            title: r.product_name,
            status: r.status,
            created_at: r.created_at,
          })),
          ...(selfRes.data || []).map((r) => ({
            id: r.id,
            type: 'self_purchase' as const,
            title: r.description,
            status: r.status,
            created_at: r.created_at,
          })),
        ];

        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (isMounted) setActivities(items.slice(0, 8));
      } catch (err) {
        console.error('Error loading recent activity:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [userId, isAdmin]);

  return { activities, loading };
}
