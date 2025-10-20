import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// E.164 phone format validation
const phoneRegex = /^\+[1-9]\d{1,14}$/;

const clientSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  phone_number: z
    .string()
    .regex(phoneRegex, 'Phone number must be in E.164 format (e.g., +1234567890)')
    .or(z.literal('')),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: {
    id: string;
    client_name: string;
    phone_number: string | null;
    notes: string | null;
  } | null;
};

const ClientFormDialog = ({ open, onOpenChange, client }: ClientFormDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_name: '',
      phone_number: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        client_name: client.client_name,
        phone_number: client.phone_number || '',
        notes: client.notes || '',
      });
    } else {
      form.reset({
        client_name: '',
        phone_number: '',
        notes: '',
      });
    }
  }, [client, form]);

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (client) {
        const { error } = await supabase
          .from('air_cargo_clients')
          .update(data)
          .eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('air_cargo_clients')
          .insert([data as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['air-cargo-clients'] });
      toast.success(client ? 'Client updated successfully' : 'Client added successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save client');
    },
  });

  const onSubmit = (data: ClientFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update client information' : 'Add a new air cargo client to your database'}
          </DialogDescription>
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
                    <Input placeholder="Enter client name" {...field} />
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
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Must be in E.164 format (e.g., +1234567890)
                  </p>
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
                    <Textarea
                      placeholder="Additional notes about this client"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : client ? 'Update' : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
