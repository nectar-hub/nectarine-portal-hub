import { useState, useEffect } from 'react';
import { fetchDashboardStats, DashboardStats } from '@/services/analyticsService';

export function useDashboardStats(userId?: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingRequests: 0,
    userBuyRequests: 0,
    userPackagesInTransit: 0,
    userTotalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dashboardStats = await fetchDashboardStats(userId);
        
        if (isMounted) {
          setStats(dashboardStats);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        if (isMounted) {
          setError('Failed to load dashboard statistics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const refetch = async () => {
    try {
      setLoading(true);
      const dashboardStats = await fetchDashboardStats(userId);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error refetching dashboard stats:', err);
      setError('Failed to refresh dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch };
}