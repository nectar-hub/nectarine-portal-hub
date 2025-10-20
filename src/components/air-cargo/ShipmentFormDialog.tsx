import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Lock, LockOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const shipmentSchema = z.object({
  date_received: z.string(),
  client_id: z.string().min(1, 'Client is required'),
  invoice_no: z.string().optional(),
  pieces: z.coerce.number().optional(),
  length_cm: z.coerce.number().positive('Length must be positive').optional(),
  width_cm: z.coerce.number().positive('Width must be positive').optional(),
  height_cm: z.coerce.number().positive('Height must be positive').optional(),
  dead_weight_kg: z.coerce.number().positive('Dead weight must be positive').optional(),
  volumetric_weight_kg: z.coerce.number().optional(),
  volumetric_weight_locked: z.boolean(),
  destination: z.string().optional(),
  packed_in: z.string().optional(),
  status: z.enum(['RECEIVED', 'PROCESSING', 'READY', 'SENT', 'DELIVERED']),
  dims_notes: z.string().optional(),
  account_code: z.string().optional(),
  remarks: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

type Client = {
  id: string;
  client_name: string;
};

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
  destination: string | null;
  packed_in: string | null;
  status: string;
  dims_notes: string | null;
  account_code: string | null;
  remarks: string | null;
};

type ShipmentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  shipment?: Shipment | null;
};

const ShipmentFormDialog = ({ open, onOpenChange, clients, shipment }: ShipmentFormDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      date_received: format(new Date(), 'yyyy-MM-dd'),
      client_id: '',
      status: 'RECEIVED',
      volumetric_weight_locked: false,
    },
  });

  useEffect(() => {
    if (shipment) {
      form.reset({
        date_received: shipment.date_received,
        client_id: shipment.client_id,
        invoice_no: shipment.invoice_no || '',
        pieces: shipment.pieces || undefined,
        length_cm: shipment.length_cm || undefined,
        width_cm: shipment.width_cm || undefined,
        height_cm: shipment.height_cm || undefined,
        dead_weight_kg: shipment.dead_weight_kg || undefined,
        volumetric_weight_kg: shipment.volumetric_weight_kg || undefined,
        volumetric_weight_locked: shipment.volumetric_weight_locked,
        destination: shipment.destination || '',
        packed_in: shipment.packed_in || '',
        status: shipment.status as any,
        dims_notes: shipment.dims_notes || '',
        account_code: shipment.account_code || '',
        remarks: shipment.remarks || '',
      });
    } else {
      form.reset({
        date_received: format(new Date(), 'yyyy-MM-dd'),
        client_id: '',
        status: 'RECEIVED',
        volumetric_weight_locked: false,
      });
    }
  }, [shipment, form]);

  const mutation = useMutation({
    mutationFn: async (data: ShipmentFormData) => {
      if (shipment) {
        const { error } = await supabase
          .from('air_cargo_shipments')
          .update(data)
          .eq('id', shipment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('air_cargo_shipments')
          .insert([data as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['air-cargo-shipments'] });
      toast.success(shipment ? 'Shipment updated' : 'Shipment added');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save shipment');
    },
  });

  const onSubmit = (data: ShipmentFormData) => {
    mutation.mutate(data);
  };

  const vwLocked = form.watch('volumetric_weight_locked');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shipment ? 'Edit Shipment' : 'Add New Shipment'}</DialogTitle>
          <DialogDescription>
            {shipment ? 'Update shipment details' : 'Add a new air cargo shipment'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_received"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Received *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.client_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoice_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pieces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pieces</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                        <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                        <SelectItem value="READY">READY</SelectItem>
                        <SelectItem value="SENT">SENT</SelectItem>
                        <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold">Dimensions & Weight</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="length_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="width_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dead_weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dead Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volumetric_weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volumetric Weight (kg)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            disabled={!vwLocked}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => form.setValue('volumetric_weight_locked', !vwLocked)}
                        >
                          {vwLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packed_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packed In</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dims_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dims Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : shipment ? 'Update' : 'Add Shipment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentFormDialog;
