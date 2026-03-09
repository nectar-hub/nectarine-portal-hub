import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ShipmentFormDialog from './ShipmentFormDialog';

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

type ShipmentRowProps = {
  shipment: Shipment;
  clients: Client[];
};

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  READY: 'bg-purple-500',
  SENT: 'bg-indigo-500',
  DELIVERED: 'bg-green-500',
};

const ShipmentRow = ({ shipment, clients }: ShipmentRowProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const client = clients.find(c => c.id === shipment.client_id);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('air_cargo_shipments')
        .delete()
        .eq('id', shipment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['air-cargo-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['air-cargo-shipments-counts'] });
      toast.success('Shipment deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete shipment');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const { id, created_at, updated_at, created_by, updated_by, ...shipmentData } = shipment;
      const { error } = await supabase
        .from('air_cargo_shipments')
        .insert([shipmentData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['air-cargo-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['air-cargo-shipments-counts'] });
      toast.success('Shipment duplicated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate shipment');
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      deleteMutation.mutate();
    }
  };

  const hasError = 
    (shipment.length_cm && shipment.length_cm <= 0) ||
    (shipment.width_cm && shipment.width_cm <= 0) ||
    (shipment.height_cm && shipment.height_cm <= 0) ||
    (shipment.dead_weight_kg && shipment.dead_weight_kg <= 0);

  return (
    <>
      <tr className={`border-b hover:bg-muted/50 ${hasError ? 'bg-red-50' : ''}`}>
        <td className="px-2 py-2 sticky left-0 bg-background">{shipment.date_received}</td>
        <td className="px-2 py-2 font-medium">{client?.client_name}</td>
        <td className="px-2 py-2">{shipment.invoice_no}</td>
        <td className="px-2 py-2 text-right">{shipment.pieces}</td>
        <td className="px-2 py-2 text-right">{shipment.length_cm?.toFixed(2)}</td>
        <td className="px-2 py-2 text-right">{shipment.width_cm?.toFixed(2)}</td>
        <td className="px-2 py-2 text-right">{shipment.height_cm?.toFixed(2)}</td>
        <td className="px-2 py-2 text-right">{shipment.dead_weight_kg?.toFixed(2)}</td>
        <td className="px-2 py-2 text-right">{shipment.volumetric_weight_kg?.toFixed(2)}</td>
        <td className="px-2 py-2 text-right font-semibold">{shipment.chargeable_weight_kg?.toFixed(2)}</td>
        <td className="px-2 py-2">{shipment.destination}</td>
        <td className="px-2 py-2">{shipment.packed_in}</td>
        <td className="px-2 py-2">
          <Badge className={`${statusColors[shipment.status]} text-white`}>
            {shipment.status}
          </Badge>
        </td>
        <td className="px-2 py-2 text-xs">{shipment.dims_notes}</td>
        <td className="px-2 py-2">{shipment.account_code}</td>
        <td className="px-2 py-2 text-xs">{shipment.remarks}</td>
        <td className="px-2 py-2">
          <div className="flex gap-1 justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditOpen(true)}
              disabled={shipment.status === 'DELIVERED'}
              title={shipment.status === 'DELIVERED' ? 'Cannot edit delivered shipments' : 'Edit shipment'}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => duplicateMutation.mutate()}
              disabled={shipment.status === 'DELIVERED'}
              title={shipment.status === 'DELIVERED' ? 'Cannot duplicate delivered shipments' : 'Duplicate shipment'}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
              disabled={shipment.status === 'DELIVERED'}
              title={shipment.status === 'DELIVERED' ? 'Cannot delete delivered shipments' : 'Delete shipment'}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </td>
      </tr>

      <ShipmentFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        clients={clients}
        shipment={shipment}
      />
    </>
  );
};

export default ShipmentRow;
