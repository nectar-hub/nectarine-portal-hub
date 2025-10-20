import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import ConsignmentFormDialog from './ConsignmentFormDialog';
import { Badge } from '@/components/ui/badge';

interface ConsignmentsListProps {
  onSelectConsignment: (consignmentId: string) => void;
  selectedConsignmentId?: string;
}

const ConsignmentsList = ({ onSelectConsignment, selectedConsignmentId }: ConsignmentsListProps) => {
  const [showDialog, setShowDialog] = useState(false);

  const { data: consignments, isLoading } = useQuery({
    queryKey: ['air-cargo-consignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('air_cargo_consignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: shipmentCounts } = useQuery({
    queryKey: ['air-cargo-shipments-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('air_cargo_shipments')
        .select('consignment_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((shipment) => {
        if (shipment.consignment_id) {
          counts[shipment.consignment_id] = (counts[shipment.consignment_id] || 0) + 1;
        }
      });

      return counts;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Consignments</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Consignment
        </Button>
      </div>

      {isLoading ? (
        <div>Loading consignments...</div>
      ) : !consignments || consignments.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No consignments yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {consignments.map((consignment) => (
            <Card
              key={consignment.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                selectedConsignmentId === consignment.id ? 'border-primary' : ''
              }`}
              onClick={() => onSelectConsignment(consignment.id)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{consignment.consignment_name}</h3>
                  <Badge variant={consignment.status === 'OPEN' ? 'default' : 'secondary'}>
                    {consignment.status}
                  </Badge>
                </div>
                {consignment.consignment_number && (
                  <p className="text-sm text-muted-foreground">
                    #{consignment.consignment_number}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{shipmentCounts?.[consignment.id] || 0} shipments</span>
                </div>
                {consignment.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {consignment.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConsignmentFormDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
};

export default ConsignmentsList;
