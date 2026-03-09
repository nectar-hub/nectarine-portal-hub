import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PurchaseReportsFilters from './PurchaseReportsFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, ShoppingCart, Hash, DollarSign } from 'lucide-react';
import { REGION_CURRENCIES } from '@/types/purchase-tracker';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(200, 70%, 50%)',
  'hsl(45, 85%, 50%)',
  'hsl(120, 50%, 45%)',
];

const PurchaseReportsView = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['purchase-tracker-reports', startDate, endDate],
    queryFn: async () => {
      const { data: purchases, error } = await supabase
        .from('purchase_tracker')
        .select(`
          *,
          items:purchase_tracker_items(*),
          client:air_cargo_clients(client_name)
        `)
        .gte('invoice_date', format(startDate, 'yyyy-MM-dd'))
        .lte('invoice_date', format(endDate, 'yyyy-MM-dd'))
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      const totalPurchases = purchases?.length || 0;
      let totalQuantity = 0;
      let totalAmount = 0;

      purchases?.forEach(p => {
        if (p.items && p.items.length > 0) {
          p.items.forEach((item: any) => {
            totalQuantity += item.qty || 0;
            totalAmount += Number(item.amount) || 0;
          });
        }
      });

      const groupBy = (key: string, getLabel: (p: any) => string) =>
        purchases?.reduce((acc, p) => {
          const label = getLabel(p);
          if (!acc[label]) acc[label] = { count: 0, quantity: 0, amount: 0 };
          acc[label].count++;
          if (p.items && p.items.length > 0) {
            p.items.forEach((item: any) => {
              acc[label].quantity += item.qty || 0;
              acc[label].amount += Number(item.amount) || 0;
            });
          }
          return acc;
        }, {} as Record<string, { count: number; quantity: number; amount: number }>) || {};

      return {
        totalPurchases,
        totalQuantity,
        totalAmount,
        byClient: groupBy('client', p => p.client?.client_name || 'Unknown'),
        byRegion: groupBy('region', p => p.from_region || 'Unknown'),
        byStatus: groupBy('status', p => p.status || 'Unknown'),
        purchases
      };
    }
  });

  const handleFilterChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const clientChartData = Object.entries(reportData?.byClient || {})
    .map(([name, stats]) => ({ name, purchases: stats.count, amount: Number(stats.amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount);

  const regionChartData = Object.entries(reportData?.byRegion || {})
    .map(([name, stats]) => ({ name, purchases: stats.count, amount: Number(stats.amount.toFixed(2)) }));

  const statusPieData = Object.entries(reportData?.byStatus || {})
    .map(([name, stats]) => ({ name, value: stats.count }));

  return (
    <div className="space-y-6 p-6">
      <PurchaseReportsFilters onFilterChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {format(startDate, 'PPP')} — {format(endDate, 'PPP')}
      </p>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Purchases', value: reportData?.totalPurchases || 0, icon: ShoppingCart, suffix: '' },
          { label: 'Total Quantity', value: reportData?.totalQuantity || 0, icon: Hash, suffix: '' },
          { label: 'Total Amount', value: (reportData?.totalAmount || 0).toFixed(2), icon: DollarSign, suffix: '' },
        ].map(({ label, value, icon: Icon, suffix }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}{suffix}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Amount by Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amount by Client</CardTitle>
          </CardHeader>
          <CardContent>
            {clientChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} className="fill-muted-foreground" interval={0} />
                  <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchases by Region Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchases by Region</CardTitle>
        </CardHeader>
        <CardContent>
          {regionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={regionChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                <Bar dataKey="purchases" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Detail Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Client</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(reportData?.byClient || {}).map(([client, stats]) => (
                  <TableRow key={client}>
                    <TableCell className="font-medium">{client}</TableCell>
                    <TableCell className="text-right">{stats.count}</TableCell>
                    <TableCell className="text-right">{stats.quantity}</TableCell>
                    <TableCell className="text-right">{stats.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Region</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(reportData?.byRegion || {}).map(([region, stats]) => (
                  <TableRow key={region}>
                    <TableCell className="font-medium">
                      {region} {REGION_CURRENCIES[region as keyof typeof REGION_CURRENCIES]?.symbol}
                    </TableCell>
                    <TableCell className="text-right">{stats.count}</TableCell>
                    <TableCell className="text-right">{stats.quantity}</TableCell>
                    <TableCell className="text-right">{stats.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Status Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reportData?.byStatus || {}).map(([status, stats]) => (
                <TableRow key={status}>
                  <TableCell className="font-medium">{status}</TableCell>
                  <TableCell className="text-right">{stats.count}</TableCell>
                  <TableCell className="text-right">{stats.quantity}</TableCell>
                  <TableCell className="text-right">{stats.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseReportsView;
