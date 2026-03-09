import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExchangeRate, ExchangeRateFormData, Currency } from '@/types/currency';
import {
  Dialog,
  DialogContent,
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
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function ControlledDatePopover({ field, placeholder }: { field: any; placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            className={cn(
              'w-full pl-3 text-left font-normal',
              !field.value && 'text-muted-foreground'
            )}
          >
            {field.value ? format(field.value, 'PPP') : placeholder}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value || undefined}
          onSelect={(date) => {
            field.onChange(date);
            setOpen(false);
          }}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

  base_currency: z.string().min(1, 'Base currency is required'),
  quote_currency: z.string().min(1, 'Quote currency is required'),
  rate: z.number().positive('Rate must be positive'),
  effective_from: z.date(),
  effective_to: z.date().nullable(),
  source: z.string(),
  notes: z.string(),
  is_active: z.boolean(),
}).refine((data) => data.base_currency !== data.quote_currency, {
  message: 'Base and quote currencies must be different',
  path: ['quote_currency'],
});

interface ExchangeRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  rate?: ExchangeRate;
  onSubmit: (data: ExchangeRateFormData) => void;
  isSubmitting: boolean;
}

export function ExchangeRateFormDialog({
  open,
  onOpenChange,
  currencies,
  rate,
  onSubmit,
  isSubmitting,
}: ExchangeRateFormDialogProps) {
  const isEditing = !!rate;
  const activeCurrencies = currencies.filter((c) => c.is_active);

  const form = useForm<ExchangeRateFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      base_currency: '',
      quote_currency: '',
      rate: 1,
      effective_from: new Date(),
      effective_to: null,
      source: 'manual',
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (rate) {
      form.reset({
        base_currency: rate.base_currency,
        quote_currency: rate.quote_currency,
        rate: rate.rate,
        effective_from: new Date(rate.effective_from),
        effective_to: rate.effective_to ? new Date(rate.effective_to) : null,
        source: rate.source || 'manual',
        notes: rate.notes || '',
        is_active: rate.is_active,
      });
    } else {
      form.reset({
        base_currency: '',
        quote_currency: '',
        rate: 1,
        effective_from: new Date(),
        effective_to: null,
        source: 'manual',
        notes: '',
        is_active: true,
      });
    }
  }, [rate, form]);

  const handleSubmit = (data: ExchangeRateFormData) => {
    onSubmit(data);
  };

  const selectedBase = form.watch('base_currency');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Exchange Rate' : 'Add Exchange Rate'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
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
                name="quote_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCurrencies
                          .filter((c) => c.code !== selectedBase)
                          .map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    1 {selectedBase || 'BASE'} = {field.value} {form.watch('quote_currency') || 'QUOTE'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Effective From</FormLabel>
                    <ControlledDatePopover field={field} placeholder="Pick a date" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_to"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Effective To (Optional)</FormLabel>
                    <ControlledDatePopover field={field} placeholder="No end date" />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Optional notes..." rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
