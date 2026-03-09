import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PurchaseTracker, PurchaseTrackerItem } from '@/types/purchase-tracker';
import { MonthPeriod, getMonthLabel } from '@/types/month-period';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAddClientDialog } from './QuickAddClientDialog';
import { PurchaseItemsList } from './PurchaseItemsList';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const formSchema = z.object({
  invoice_date: z.date(),
  client_id: z.string().min(1, 'Client is required'),
  invoice_no: z.string().optional(),
  from_region: z.enum(['UK', 'US', 'UAE', 'CN', 'EU', 'AU']),
  dop: z.date().optional(),
  purchased_by: z.string().optional(),
  status: z.enum(['PENDING', 'ORDERED', 'RECEIVED', 'IN_TRANSIT', 'READY', 'DELIVERED', 'CANCELLED']),
  remarks: z.string().optional(),
  month_period_id: z.string().min(1, 'Month period is required'),
});

interface PurchaseRowEditorProps {
  purchase: PurchaseTracker | null;
  clients: Array<{ id: string; client_name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonthPeriodId?: string | null;
  onSave: () => void;
}

export function PurchaseRowEditor({ purchase, clients, open, onOpenChange, defaultMonthPeriodId, onSave }: PurchaseRowEditorProps) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [localClients, setLocalClients] = useState(clients);
  const [items, setItems] = useState<Partial<PurchaseTrackerItem>[]>([]);
  const isEditing = !!purchase;

  // Fetch month periods
  const { data: periods = [] } = useQuery({
    queryKey: ['month-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('month_periods')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data as MonthPeriod[];
    },
  });

  // Update local clients when props change
  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  // Initialize items
  useEffect(() => {
    if (purchase?.items && purchase.items.length > 0) {
      setItems(purchase.items);
    } else {
      setItems([{ item_description: '', qty: 1 }]);
    }
  }, [purchase]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_date: purchase?.invoice_date ? new Date(purchase.invoice_date) : new Date(),
      client_id: purchase?.client_id || '',
      invoice_no: purchase?.invoice_no || '',
      from_region: purchase?.from_region || 'UK',
      dop: purchase?.dop ? new Date(purchase.dop) : undefined,
      purchased_by: purchase?.purchased_by || '',
      status: purchase?.status || 'PENDING',
      remarks: purchase?.remarks || '',
      month_period_id: purchase?.month_period_id || defaultMonthPeriodId || '',
    },
  });

  const handleItemChange = (index: number, field: keyof PurchaseTrackerItem, value: string | number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { item_description: '', qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateItems = () => {
    for (const item of items) {
      if (!item.item_description || item.item_description.trim() === '') {
        toast.error('All items must have a description');
        return false;
      }
      if (!item.qty || item.qty < 1) {
        toast.error('All items must have a valid quantity');
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!validateItems()) return;

    const data = {
      invoice_date: format(values.invoice_date, 'yyyy-MM-dd'),
      client_id: values.client_id,
      invoice_no: values.invoice_no || null,
      from_region: values.from_region,
      dop: values.dop ? format(values.dop, 'yyyy-MM-dd') : null,
      purchased_by: values.purchased_by || null,
      status: values.status,
      remarks: values.remarks || null,
      month_period_id: values.month_period_id || null,
      // Clear deprecated fields
      item_description: null,
      qty: null,
      store_name: null,
      amount: null,
      store_order_no: null,
      source_link: null,
    };

    if (isEditing) {
      // Update purchase
      const { error: purchaseError } = await supabase
        .from('purchase_tracker')
        .update(data)
        .eq('id', purchase.id);

      if (purchaseError) {
        toast.error('Failed to update purchase record');
        console.error(purchaseError);
        return;
      }

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('purchase_tracker_items')
        .delete()
        .eq('purchase_id', purchase.id);

      if (deleteError) {
        toast.error('Failed to update items');
        console.error(deleteError);
        return;
      }

      // Insert new items
      const itemsToInsert = items.map(({ id, created_at, updated_at, ...item }) => ({
        purchase_id: purchase.id,
        item_description: item.item_description!,
        qty: Number(item.qty) || 1,
        amount: item.amount ? Number(item.amount) : null,
        store_name: item.store_name || null,
        store_order_no: item.store_order_no || null,
        source_link: item.source_link || null,
        dod: item.dod || null,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_tracker_items')
        .insert(itemsToInsert);

      if (itemsError) {
        toast.error('Failed to save items');
        console.error(itemsError);
        return;
      }

      toast.success('Purchase record updated');
      onSave();
    } else {
      // Create new purchase
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('purchase_tracker')
        .insert([data])
        .select()
        .single();

      if (purchaseError || !newPurchase) {
        toast.error('Failed to create purchase record');
        console.error(purchaseError);
        return;
      }

      // Insert items
      const itemsToInsert = items.map(item => ({
        purchase_id: newPurchase.id,
        item_description: item.item_description!,
        qty: Number(item.qty) || 1,
        amount: item.amount ? Number(item.amount) : null,
        store_name: item.store_name || null,
        store_order_no: item.store_order_no || null,
        source_link: item.source_link || null,
        dod: item.dod || null,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_tracker_items')
        .insert(itemsToInsert);

      if (itemsError) {
        toast.error('Failed to save items');
        console.error(itemsError);
        return;
      }

      toast.success('Purchase record created');
      onSave();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Purchase' : 'Add New Purchase'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
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
                      <div className="flex gap-2 flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  'flex-1 justify-between',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value
                                  ? localClients.find((c) => c.id === field.value)?.client_name
                                  : 'Select client'}
                                <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search clients..." />
                              <CommandList>
                                <CommandEmpty>No client found.</CommandEmpty>
                                <CommandGroup>
                                  {localClients.map((client) => (
                                    <CommandItem
                                      key={client.id}
                                      value={client.client_name}
                                      onSelect={() => {
                                        field.onChange(client.id);
                                      }}
                                    >
                                      {client.client_name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddClient(true)}
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
                  name="from_region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Region *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  name="dop"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Purchase</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
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
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Enter purchaser name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dod"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Delivery</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
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
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="ORDERED">Ordered</SelectItem>
                          <SelectItem value="RECEIVED">Received</SelectItem>
                          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                          <SelectItem value="READY">Ready</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month_period_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month Period *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periods.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {getMonthLabel(period)} {period.status === 'CLOSED' && '🔒'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Items list */}
              <PurchaseItemsList
                items={items}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
                onAdd={handleAddItem}
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showAddClient && (
        <QuickAddClientDialog
          open={showAddClient}
          onOpenChange={setShowAddClient}
          onClientAdded={(clientId) => {
            form.setValue('client_id', clientId);
            // The parent will refetch clients, which will update localClients via useEffect
          }}
        />
      )}
    </>
  );
}
