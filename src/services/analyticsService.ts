import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsData {
  totalOrders: number;
  totalUsers: number;
  pendingRequests: number;
  completedOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersOverTime: { name: string; value: number }[];
  ordersByCountry: { name: string; value: number }[];
  ordersByStatus: { name: string; value: number }[];
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface DashboardStats {
  totalUsers: number;
  pendingRequests: number;
  userBuyRequests: number;
  userPackagesInTransit: number;
  userTotalOrders: number;
}

export async function fetchAnalyticsData(timeRange = 'month'): Promise<AnalyticsData> {
  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch all data in parallel
    const [
      ordersResult,
      usersResult,
      buyRequestsResult,
      selfPurchasesResult
    ] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('buy_requests').select('*'),
      supabase.from('self_purchases').select('*')
    ]);

    const orders = ordersResult.data || [];
    const users = usersResult.data || [];
    const buyRequests = buyRequestsResult.data || [];
    const selfPurchases = selfPurchasesResult.data || [];

    // Calculate metrics
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const pendingRequests = [...buyRequests, ...selfPurchases].filter(req => req.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    // Mock revenue calculation (since we don't have actual revenue data)
    const totalRevenue = buyRequests.reduce((sum, req) => sum + (req.product_price || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders over time (last 12 months)
    const ordersOverTime = generateTimeSeriesData(orders, 12, 'month');
    
    // Orders by country
    const ordersByCountry = generateCountryData(buyRequests);
    
    // Orders by status
    const ordersByStatus = generateStatusData([...buyRequests, ...selfPurchases]);

    // Recent activity
    const recentActivity = generateRecentActivity([...buyRequests, ...selfPurchases]);

    return {
      totalOrders,
      totalUsers,
      pendingRequests,
      completedOrders,
      totalRevenue,
      avgOrderValue,
      ordersOverTime,
      ordersByCountry,
      ordersByStatus,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
}

export async function fetchDashboardStats(userId?: string): Promise<DashboardStats> {
  try {
    const [
      usersResult,
      buyRequestsResult,
      selfPurchasesResult,
      ordersResult
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      userId 
        ? supabase.from('buy_requests').select('*').eq('user_id', userId)
        : supabase.from('buy_requests').select('*'),
      userId 
        ? supabase.from('self_purchases').select('*').eq('user_id', userId)
        : supabase.from('self_purchases').select('*'),
      userId 
        ? supabase.from('orders').select('*').eq('user_id', userId)
        : supabase.from('orders').select('*')
    ]);

    const users = usersResult.data || [];
    const buyRequests = buyRequestsResult.data || [];
    const selfPurchases = selfPurchasesResult.data || [];
    const orders = ordersResult.data || [];

    const totalUsers = users.length;
    const allRequests = [...buyRequests, ...selfPurchases];
    const pendingRequests = allRequests.filter(req => req.status === 'pending').length;
    
    // User-specific stats
    const userBuyRequests = buyRequests.length;
    const userPackagesInTransit = orders.filter(order => 
      ['processing', 'shipped', 'in_transit'].includes(order.status)
    ).length;
    const userTotalOrders = orders.length;

    return {
      totalUsers,
      pendingRequests,
      userBuyRequests,
      userPackagesInTransit,
      userTotalOrders
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      pendingRequests: 0,
      userBuyRequests: 0,
      userPackagesInTransit: 0,
      userTotalOrders: 0
    };
  }
}

function generateTimeSeriesData(orders: any[], periods: number, interval: 'month' | 'week'): { name: string; value: number }[] {
  const data = [];
  const now = new Date();
  
  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date(now);
    if (interval === 'month') {
      date.setMonth(date.getMonth() - i);
    } else {
      date.setDate(date.getDate() - (i * 7));
    }
    
    const monthName = date.toLocaleString('default', { month: 'short' });
    const startOfPeriod = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfPeriod = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const count = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfPeriod && orderDate <= endOfPeriod;
    }).length;
    
    data.push({ name: monthName, value: count });
  }
  
  return data;
}

function generateCountryData(buyRequests: any[]): { name: string; value: number }[] {
  const countryCounts: Record<string, number> = {};
  
  buyRequests.forEach(request => {
    const country = request.country_of_purchase || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  
  return Object.entries(countryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 countries
}

function generateStatusData(requests: any[]): { name: string; value: number }[] {
  const statusCounts: Record<string, number> = {};
  
  requests.forEach(request => {
    const status = request.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  return Object.entries(statusCounts)
    .map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
}

function generateRecentActivity(requests: any[]): Array<{
  id: string;
  type: string;
  description: string;
  timestamp: string;
}> {
  return requests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(request => ({
      id: request.id,
      type: request.product_name ? 'buy_request' : 'self_purchase',
      description: request.product_name || request.description || 'New request',
      timestamp: request.created_at
    }));
}