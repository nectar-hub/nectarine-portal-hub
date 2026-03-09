import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReportsFilters from './ReportsFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, Package, Boxes, Weight, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
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

const ReportsView = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['air-cargo-reports', startDate, endDate],
    queryFn: async () => {
      const { data: shipments, error } = await supabase
        .from('air_cargo_shipments')
        .select(`
          *,
          client:air_cargo_clients(client_name),
          consignment:air_cargo_consignments(consignment_name, consignment_number)
        `)
        .gte('date_received', format(startDate, 'yyyy-MM-dd'))
        .lte('date_received', format(endDate, 'yyyy-MM-dd'))
        .order('date_received', { ascending: false });

      if (error) throw error;

      const totalShipments = shipments?.length || 0;
      const totalPieces = shipments?.reduce((sum, s) => sum + (s.pieces || 0), 0) || 0;
      const totalDeadWeight = shipments?.reduce((sum, s) => sum + (Number(s.dead_weight_kg) || 0), 0) || 0;
      const totalChargeableWeight = shipments?.reduce((sum, s) => sum + (Number(s.chargeable_weight_kg) || 0), 0) || 0;

      const byClient = shipments?.reduce((acc, s) => {
        const clientName = s.client?.client_name || 'Unknown';
        if (!acc[clientName]) acc[clientName] = { count: 0, pieces: 0, chargeableWeight: 0 };
        acc[clientName].count++;
        acc[clientName].pieces += s.pieces || 0;
        acc[clientName].chargeableWeight += Number(s.chargeable_weight_kg) || 0;
        return acc;
      }, {} as Record<string, { count: number; pieces: number; chargeableWeight: number }>);

      const byConsignment = shipments?.reduce((acc, s) => {
        const consignmentName = s.consignment?.consignment_name || 'No Consignment';
        if (!acc[consignmentName]) acc[consignmentName] = { count: 0, pieces: 0, chargeableWeight: 0 };
        acc[consignmentName].count++;
        acc[consignmentName].pieces += s.pieces || 0;
        acc[consignmentName].chargeableWeight += Number(s.chargeable_weight_kg) || 0;
        return acc;
      }, {} as Record<string, { count: number; pieces: number; chargeableWeight: number }>);

      return { totalShipments, totalPieces, totalDeadWeight, totalChargeableWeight, byClient, byConsignment, shipments };
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
    .map(([name, stats]) => ({ name, shipments: stats.count, pieces: stats.pieces, weight: Number(stats.chargeableWeight.toFixed(2)) }))
    .sort((a, b) => b.shipments - a.shipments);

  const consignmentChartData = Object.entries(reportData?.byConsignment || {})
    .map(([name, stats]) => ({ name, shipments: stats.count, weight: Number(stats.chargeableWeight.toFixed(2)) }))
    .sort((a, b) => b.weight - a.weight);

  const clientPieData = clientChartData.map(c => ({ name: c.name, value: c.shipments }));

  return (
    <div className="space-y-6">
      <ReportsFilters onFilterChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {format(startDate, 'PPP')} — {format(endDate, 'PPP')}
      </p>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Shipments', value: reportData?.totalShipments || 0, icon: Package, suffix: '' },
          { label: 'Total Pieces', value: reportData?.totalPieces || 0, icon: Boxes, suffix: '' },
          { label: 'Dead Weight', value: `${(reportData?.totalDeadWeight || 0).toFixed(1)}`, icon: Weight, suffix: ' kg' },
          { label: 'Chargeable Weight', value: `${(reportData?.totalChargeableWeight || 0).toFixed(1)}`, icon: TrendingUp, suffix: ' kg' },
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
        {/* Shipments by Client Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipments by Client</CardTitle>
          </CardHeader>
          <CardContent>
            {clientChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} className="fill-muted-foreground" interval={0} />
                  <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                  <Bar dataKey="shipments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Client Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {clientPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={clientPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                    {clientPieData.map((_, i) => (
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

      {/* Chargeable Weight by Consignment Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chargeable Weight by Consignment (kg)</CardTitle>
        </CardHeader>
        <CardContent>
          {consignmentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consignmentChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} className="fill-muted-foreground" interval={0} />
                <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                <Bar dataKey="weight" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} />
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
                  <TableHead className="text-right">Shipments</TableHead>
                  <TableHead className="text-right">Pieces</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(reportData?.byClient || {}).map(([client, stats]) => (
                  <TableRow key={client}>
                    <TableCell className="font-medium">{client}</TableCell>
                    <TableCell className="text-right">{stats.count}</TableCell>
                    <TableCell className="text-right">{stats.pieces}</TableCell>
                    <TableCell className="text-right">{stats.chargeableWeight.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Consignment</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consignment</TableHead>
                  <TableHead className="text-right">Shipments</TableHead>
                  <TableHead className="text-right">Pieces</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(reportData?.byConsignment || {}).map(([consignment, stats]) => (
                  <TableRow key={consignment}>
                    <TableCell className="font-medium">{consignment}</TableCell>
                    <TableCell className="text-right">{stats.count}</TableCell>
                    <TableCell className="text-right">{stats.pieces}</TableCell>
                    <TableCell className="text-right">{stats.chargeableWeight.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsView;
