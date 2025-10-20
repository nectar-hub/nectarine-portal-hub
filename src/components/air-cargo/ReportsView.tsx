import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReportsFilters from './ReportsFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2 } from 'lucide-react';

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

      // Calculate aggregated statistics
      const totalShipments = shipments?.length || 0;
      const totalPieces = shipments?.reduce((sum, s) => sum + (s.pieces || 0), 0) || 0;
      const totalDeadWeight = shipments?.reduce((sum, s) => sum + (Number(s.dead_weight_kg) || 0), 0) || 0;
      const totalChargeableWeight = shipments?.reduce((sum, s) => sum + (Number(s.chargeable_weight_kg) || 0), 0) || 0;

      // Group by client
      const byClient = shipments?.reduce((acc, s) => {
        const clientName = s.client?.client_name || 'Unknown';
        if (!acc[clientName]) {
          acc[clientName] = {
            count: 0,
            pieces: 0,
            chargeableWeight: 0
          };
        }
        acc[clientName].count++;
        acc[clientName].pieces += s.pieces || 0;
        acc[clientName].chargeableWeight += Number(s.chargeable_weight_kg) || 0;
        return acc;
      }, {} as Record<string, { count: number; pieces: number; chargeableWeight: number }>);

      // Group by consignment
      const byConsignment = shipments?.reduce((acc, s) => {
        const consignmentName = s.consignment?.consignment_name || 'No Consignment';
        if (!acc[consignmentName]) {
          acc[consignmentName] = {
            count: 0,
            pieces: 0,
            chargeableWeight: 0
          };
        }
        acc[consignmentName].count++;
        acc[consignmentName].pieces += s.pieces || 0;
        acc[consignmentName].chargeableWeight += Number(s.chargeable_weight_kg) || 0;
        return acc;
      }, {} as Record<string, { count: number; pieces: number; chargeableWeight: number }>);

      return {
        totalShipments,
        totalPieces,
        totalDeadWeight,
        totalChargeableWeight,
        byClient,
        byConsignment,
        shipments
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
    <div className="space-y-6">
      <ReportsFilters onFilterChange={handleFilterChange} />

      <div className="text-sm text-muted-foreground">
        Showing data from {format(startDate, 'PPP')} to {format(endDate, 'PPP')}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalShipments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pieces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalPieces || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Dead Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalDeadWeight.toFixed(2) || 0} kg</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Chargeable Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalChargeableWeight.toFixed(2) || 0} kg</div>
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
                <TableHead>Shipments</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Chargeable Weight (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reportData?.byClient || {}).map(([client, stats]) => (
                <TableRow key={client}>
                  <TableCell className="font-medium">{client}</TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>{stats.pieces}</TableCell>
                  <TableCell>{stats.chargeableWeight.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Consignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consignment</TableHead>
                <TableHead>Shipments</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Chargeable Weight (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(reportData?.byConsignment || {}).map(([consignment, stats]) => (
                <TableRow key={consignment}>
                  <TableCell className="font-medium">{consignment}</TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>{stats.pieces}</TableCell>
                  <TableCell>{stats.chargeableWeight.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsView;
