import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PurchaseReportsFilters from './PurchaseReportsFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { REGION_CURRENCIES } from '@/types/purchase-tracker';

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

      // Calculate aggregated statistics
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

      // Group by client
      const byClient = purchases?.reduce((acc, p) => {
        const clientName = p.client?.client_name || 'Unknown';
        if (!acc[clientName]) {
          acc[clientName] = {
            count: 0,
            quantity: 0,
            amount: 0
          };
        }
        acc[clientName].count++;
        if (p.items && p.items.length > 0) {
          p.items.forEach((item: any) => {
            acc[clientName].quantity += item.qty || 0;
            acc[clientName].amount += Number(item.amount) || 0;
          });
        }
        return acc;
      }, {} as Record<string, { count: number; quantity: number; amount: number }>);

      // Group by region
      const byRegion = purchases?.reduce((acc, p) => {
        const region = p.from_region || 'Unknown';
        if (!acc[region]) {
          acc[region] = {
            count: 0,
            quantity: 0,
            amount: 0
          };
        }
        acc[region].count++;
        if (p.items && p.items.length > 0) {
          p.items.forEach((item: any) => {
            acc[region].quantity += item.qty || 0;
            acc[region].amount += Number(item.amount) || 0;
          });
        }
        return acc;
      }, {} as Record<string, { count: number; quantity: number; amount: number }>);

      // Group by status
      const byStatus = purchases?.reduce((acc, p) => {
        const status = p.status || 'Unknown';
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            quantity: 0,
            amount: 0
          };
        }
        acc[status].count++;
        if (p.items && p.items.length > 0) {
          p.items.forEach((item: any) => {
            acc[status].quantity += item.qty || 0;
            acc[status].amount += Number(item.amount) || 0;
          });
        }
        return acc;
      }, {} as Record<string, { count: number; quantity: number; amount: number }>);

      return {
        totalPurchases,
        totalQuantity,
        totalAmount,
        byClient,
        byRegion,
        byStatus,
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PurchaseReportsFilters onFilterChange={handleFilterChange} />

      <div className="text-sm text-muted-foreground">
        Showing data from {format(startDate, 'PPP')} to {format(endDate, 'PPP')}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalPurchases || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalQuantity || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalAmount.toFixed(2) || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reportData?.byClient || {}).map(([client, stats]) => (
                <TableRow key={client}>
                  <TableCell className="font-medium">{client}</TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>{stats.quantity}</TableCell>
                  <TableCell>{stats.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Region</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reportData?.byRegion || {}).map(([region, stats]) => (
                <TableRow key={region}>
                  <TableCell className="font-medium">
                    {region} {REGION_CURRENCIES[region as keyof typeof REGION_CURRENCIES]?.symbol}
                  </TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>{stats.quantity}</TableCell>
                  <TableCell>{stats.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reportData?.byStatus || {}).map(([status, stats]) => (
                <TableRow key={status}>
                  <TableCell className="font-medium">{status}</TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>{stats.quantity}</TableCell>
                  <TableCell>{stats.amount.toFixed(2)}</TableCell>
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
