import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Currency, CurrencyFormData } from '@/types/currency';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  code: z.string().min(3).max(3).toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(5),
  decimal_places: z.number().min(0).max(8),
  is_active: z.boolean(),
});

interface CurrencyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: Currency;
  onSubmit: (data: CurrencyFormData) => void;
  isSubmitting: boolean;
}

export function CurrencyFormDialog({
  open,
  onOpenChange,
  currency,
  onSubmit,
  isSubmitting,
}: CurrencyFormDialogProps) {
  const isEditing = !!currency;

  const form = useForm<CurrencyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      symbol: '',
      decimal_places: 2,
      is_active: true,
    },
  });

  useEffect(() => {
    if (currency) {
      form.reset({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimal_places: currency.decimal_places,
        is_active: currency.is_active,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        symbol: '',
        decimal_places: 2,
        is_active: true,
      });
    }
  }, [currency, form]);

  const handleSubmit = (data: CurrencyFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="USD"
                      maxLength={3}
                      disabled={isEditing}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="US Dollar" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="$" maxLength={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="decimal_places"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimal Places</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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
