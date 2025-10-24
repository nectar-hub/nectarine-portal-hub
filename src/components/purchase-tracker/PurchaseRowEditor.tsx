import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PurchaseTracker, PURCHASED_BY_OPTIONS } from '@/types/purchase-tracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import QuickAddClientDialog from './QuickAddClientDialog';

const purchaseSchema = z.object({
  invoice_date: z.string().min(1, 'Required'),
  client_id: z.string().min(1, 'Required'),
  invoice_no: z.string().nullable(),
  item_description: z.string().min(1, 'Required'),
  qty: z.coerce.number().min(1, 'Must be at least 1'),
  from_region: z.enum(['UK', 'US', 'UAE', 'CN', 'EU', 'AU']),
  store_name: z.string().nullable(),
  amount: z.coerce.number().nullable(),
  dop: z.string().nullable(),
  store_order_no: z.string().nullable(),
  purchased_by: z.string().nullable(),
  dod: z.string().nullable(),
  status: z.enum([
    'PENDING',
    'ORDERED',
    'RECEIVED',
    'IN TRANSIT',
    'READY',
    'DELIVERED',
    'CANCELLED',
  ]),
  remarks: z.string().nullable(),
  source_link: z.string().url().nullable().or(z.literal('')),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseRowEditorProps {
  purchase: PurchaseTracker | null;
  onClose: () => void;
  onSave: () => void;
}

const PurchaseRowEditor = ({ purchase, onClose, onSave }: PurchaseRowEditorProps) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['air-cargo-clients-purchase'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('air_cargo_clients')
        .select('id, client_name')
        .order('client_name');

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: purchase
      ? {
          invoice_date: purchase.invoice_date,
          client_id: purchase.client_id,
          invoice_no: purchase.invoice_no,
          item_description: purchase.item_description,
          qty: purchase.qty,
          from_region: purchase.from_region,
          store_name: purchase.store_name,
          amount: purchase.amount,
          dop: purchase.dop,
          store_order_no: purchase.store_order_no,
          purchased_by: purchase.purchased_by,
          dod: purchase.dod,
          status: purchase.status,
          remarks: purchase.remarks,
          source_link: purchase.source_link,
        }
      : {
          invoice_date: new Date().toISOString().split('T')[0],
          client_id: '',
          invoice_no: '',
          item_description: '',
          qty: 1,
          from_region: 'UK',
          store_name: '',
          amount: null,
          dop: null,
          store_order_no: '',
          purchased_by: '',
          dod: null,
          status: 'PENDING',
          remarks: '',
          source_link: '',
        },
  });

  const onSubmit = async (data: PurchaseFormData) => {
    setSaving(true);
    try {
      const cleanedData = {
        ...data,
        invoice_no: data.invoice_no || null,
        store_name: data.store_name || null,
        amount: data.amount || null,
        dop: data.dop || null,
        store_order_no: data.store_order_no || null,
        purchased_by: data.purchased_by || null,
        dod: data.dod || null,
        remarks: data.remarks || null,
        source_link: data.source_link || null,
      };

      if (purchase) {
        const { error } = await supabase
          .from('purchase_tracker')
          .update(cleanedData)
          .eq('id', purchase.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('purchase_tracker')
          .insert([cleanedData as any]);

        if (error) throw error;
      }

      toast({
        title: purchase ? 'Updated' : 'Created',
        description: `Purchase ${purchase ? 'updated' : 'created'} successfully`,
      });

      onSave();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {purchase ? 'Edit Purchase' : 'Add New Purchase'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date *</FormLabel>
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
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowQuickAdd(true)}
                        >
                          +
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice No</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="from_region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UK">UK</SelectItem>
                          <SelectItem value="US">US</SelectItem>
                          <SelectItem value="UAE">UAE</SelectItem>
                          <SelectItem value="CN">CN</SelectItem>
                          <SelectItem value="EU">EU</SelectItem>
                          <SelectItem value="AU">AU</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="store_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Purchase (DOP)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="store_order_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Order No</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchased_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchased By</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-</SelectItem>
                          {PURCHASED_BY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Dispatch (DOD)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="ORDERED">ORDERED</SelectItem>
                          <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                          <SelectItem value="IN TRANSIT">IN TRANSIT</SelectItem>
                          <SelectItem value="READY">READY</SelectItem>
                          <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                          <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="item_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Description *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Link</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...field}
                        value={field.value || ''}
                      />
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
                      <Textarea {...field} value={field.value || ''} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : purchase ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showQuickAdd && (
        <QuickAddClientDialog
          onClose={() => setShowQuickAdd(false)}
          onClientAdded={(clientId) => {
            form.setValue('client_id', clientId);
            setShowQuickAdd(false);
          }}
        />
      )}
    </>
  );
};

export default PurchaseRowEditor;
