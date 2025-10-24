import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const clientSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  phone_number: z.string().nullable(),
  notes: z.string().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface QuickAddClientDialogProps {
  onClose: () => void;
  onClientAdded: (clientId: string) => void;
}

const QuickAddClientDialog = ({
  onClose,
  onClientAdded,
}: QuickAddClientDialogProps) => {
  const [saving, setSaving] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_name: '',
      phone_number: '',
      notes: '',
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setSaving(true);
    try {
      const { data: newClient, error } = await supabase
        .from('air_cargo_clients')
        .insert({
          client_name: data.client_name,
          phone_number: data.phone_number || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Client added',
        description: 'New client has been created successfully',
      });

      onClientAdded(newClient.id);
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Add Client</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
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
                    <Textarea {...field} value={field.value || ''} rows={3} />
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
                {saving ? 'Adding...' : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddClientDialog;
