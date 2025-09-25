import { useState, useEffect } from 'react';
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

  return { data, loading, error };
}