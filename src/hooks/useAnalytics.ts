import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchAnalyticsData, AnalyticsData } from '@/services/analyticsService';

export function useAnalytics(timeRange = 'month') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const analyticsData = await fetchAnalyticsData(timeRange);
        
        if (isMounted) {
          setData(analyticsData);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
        if (isMounted) {
          setError('Failed to load analytics data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  // Real-time subscriptions for analytics data
  useEffect(() => {
    console.log('[ANALYTICS REALTIME] Setting up subscriptions');

    const buyRequestsChannel = supabase
      .channel('analytics_buy_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buy_requests'
        },
        async (payload) => {
          console.log('[ANALYTICS REALTIME] Buy request change detected:', payload);
          const analyticsData = await fetchAnalyticsData(timeRange);
          setData(analyticsData);
        }
      )
      .subscribe();

    const selfPurchasesChannel = supabase
      .channel('analytics_self_purchases')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'self_purchases'
        },
        async (payload) => {
          console.log('[ANALYTICS REALTIME] Self purchase change detected:', payload);
          const analyticsData = await fetchAnalyticsData(timeRange);
          setData(analyticsData);
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('analytics_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          console.log('[ANALYTICS REALTIME] Order change detected:', payload);
          const analyticsData = await fetchAnalyticsData(timeRange);
          setData(analyticsData);
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('analytics_profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        async (payload) => {
          console.log('[ANALYTICS REALTIME] Profile change detected:', payload);
          const analyticsData = await fetchAnalyticsData(timeRange);
          setData(analyticsData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buyRequestsChannel);
      supabase.removeChannel(selfPurchasesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [timeRange]);

  return { data, loading, error };
}