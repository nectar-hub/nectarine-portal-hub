import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Printer, Search, Filter } from 'lucide-react';
import ShipmentRow from './ShipmentRow';
import ShipmentFormDialog from './ShipmentFormDialog';
import ShipmentFilters from './ShipmentFilters';

type Shipment = {
  id: string;
  date_received: string;
  client_id: string;
  invoice_no: string | null;
  pieces: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  dead_weight_kg: number | null;
  volumetric_weight_kg: number | null;
  volumetric_weight_locked: boolean;
  chargeable_weight_kg: number | null;
  destination: string | null;
  packed_in: string | null;
  status: string;
  dims_notes: string | null;
  account_code: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type Client = {
  id: string;
  client_name: string;
};

interface AirCargoSheetProps {
  consignmentId?: string;
}

const AirCargoSheet = ({ consignmentId }: AirCargoSheetProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    clientId: '',
    destination: '',
    status: '',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['air-cargo-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('air_cargo_clients')
        .select('id, client_name')
        .order('client_name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['air-cargo-shipments', consignmentId],
    queryFn: async () => {
      let query = supabase
        .from('air_cargo_shipments')
        .select('*')
        .order('date_received', { ascending: false })
        .order('created_at', { ascending: false });

      if (consignmentId) {
        query = query.eq('consignment_id', consignmentId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Shipment[];
    },
  });

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const client = clients.find(c => c.id === shipment.client_id);
      const clientName = client?.client_name.toLowerCase() || '';
      const search = searchQuery.toLowerCase();

      const matchesSearch = 
        clientName.includes(search) ||
        shipment.invoice_no?.toLowerCase().includes(search) ||
        shipment.destination?.toLowerCase().includes(search);

      const matchesDateFrom = !filters.dateFrom || shipment.date_received >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || shipment.date_received <= filters.dateTo;
      const matchesClient = !filters.clientId || shipment.client_id === filters.clientId;
      const matchesDestination = !filters.destination || shipment.destination?.toLowerCase().includes(filters.destination.toLowerCase());
      const matchesStatus = !filters.status || shipment.status === filters.status;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesClient && matchesDestination && matchesStatus;
    });
  }, [shipments, clients, searchQuery, filters]);

  const totals = useMemo(() => {
    return filteredShipments.reduce(
      (acc, shipment) => ({
        totalDW: acc.totalDW + (shipment.dead_weight_kg || 0),
        totalVW: acc.totalVW + (shipment.volumetric_weight_kg || 0),
        totalCW: acc.totalCW + (shipment.chargeable_weight_kg || 0),
      }),
      { totalDW: 0, totalVW: 0, totalCW: 0 }
    );
  }, [filteredShipments]);

  const handleExportCSV = () => {
    const headers = [
      'Date', 'Client', 'INV', 'PCS', 'L', 'W', 'H', 'D/W', 'V/W', 'C/W',
      'Destination', 'Packed In', 'Status', 'Dims', 'A/C', 'Remarks'
    ];

    const rows = filteredShipments.map(s => {
      const client = clients.find(c => c.id === s.client_id);
      return [
        s.date_received,
        client?.client_name || '',
        s.invoice_no || '',
        s.pieces || '',
        s.length_cm || '',
        s.width_cm || '',
        s.height_cm || '',
        s.dead_weight_kg || '',
        s.volumetric_weight_kg || '',
        s.chargeable_weight_kg || '',
        s.destination || '',
        s.packed_in || '',
        s.status,
        s.dims_notes || '',
        s.account_code || '',
        s.remarks || ''
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      `Totals,,,,,,,,${totals.totalDW.toFixed(2)},${totals.totalVW.toFixed(2)},${totals.totalCW.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air-cargo-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Air Cargo Sheet</CardTitle>
              <CardDescription>Excel-like shipment tracking</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <ShipmentFilters
              filters={filters}
              setFilters={setFilters}
              clients={clients}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading shipments...</div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium min-w-[100px] sticky left-0 bg-muted">Date</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[150px]">Client</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[80px]">INV</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[60px]">PCS</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[60px]">L</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[60px]">W</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[60px]">H</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[80px]">D/W</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[80px]">V/W</th>
                    <th className="px-2 py-2 text-right font-medium min-w-[80px]">C/W</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[100px]">DEST</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[100px]">PACKED IN</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[100px]">STA</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[100px]">DIMS</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[80px]">A/C</th>
                    <th className="px-2 py-2 text-left font-medium min-w-[150px]">REMARKS</th>
                    <th className="px-2 py-2 text-center font-medium min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="text-center py-8 text-muted-foreground">
                        No shipments found. Add your first shipment!
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((shipment) => (
                      <ShipmentRow
                        key={shipment.id}
                        shipment={shipment}
                        clients={clients}
                      />
                    ))
                  )}
                </tbody>
                <tfoot className="bg-muted font-bold sticky bottom-0">
                  <tr>
                    <td colSpan={7} className="px-2 py-3 text-right">TOTALS:</td>
                    <td className="px-2 py-3 text-right">{totals.totalDW.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right">{totals.totalVW.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right">{totals.totalCW.toFixed(2)}</td>
                    <td colSpan={7}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        <ShipmentFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          clients={clients}
          consignmentId={consignmentId}
        />
      </CardContent>
    </Card>
  );
};

export default AirCargoSheet;
