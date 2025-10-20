import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConsignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConsignmentFormDialog = ({ open, onOpenChange }: ConsignmentFormDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    consignment_name: '',
    consignment_number: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('air_cargo_consignments')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Consignment created successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['air-cargo-consignments'] });
      onOpenChange(false);
      setFormData({
        consignment_name: '',
        consignment_number: '',
        notes: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Consignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consignment_name">Consignment Name *</Label>
            <Input
              id="consignment_name"
              value={formData.consignment_name}
              onChange={(e) =>
                setFormData({ ...formData, consignment_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consignment_number">Consignment Number</Label>
            <Input
              id="consignment_number"
              value={formData.consignment_number}
              onChange={(e) =>
                setFormData({ ...formData, consignment_number: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Consignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConsignmentFormDialog;
