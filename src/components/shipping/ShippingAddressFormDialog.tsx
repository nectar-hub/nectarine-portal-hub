import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { ShippingAddressRow } from '@/pages/admin/ShippingAddresses';

interface Props {
  open: boolean;
  onOpenChange: () => void;
  address: ShippingAddressRow | null;
}

const ShippingAddressFormDialog = ({ open, onOpenChange, address }: Props) => {
  const [country, setCountry] = useState('');
  const [label, setLabel] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [addressText, setAddressText] = useState('');
  const [instructions, setInstructions] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (address) {
      setCountry(address.country);
      setLabel(address.label || '');
      setReferenceCode(address.reference_code);
      setAddressText(address.address);
      setInstructions(address.instructions || '');
    } else {
      setCountry('');
      setLabel('');
      setReferenceCode('');
      setAddressText('');
      setInstructions('');
    }
  }, [address, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        country: country.trim(),
        label: label.trim() || null,
        reference_code: referenceCode.trim(),
        address: addressText.trim(),
        instructions: instructions.trim() || null,
      };

      if (address) {
        const { error } = await supabase
          .from('shipping_addresses')
          .update(payload)
          .eq('id', address.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_addresses')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-addresses'] });
      toast.success(address ? 'Address updated' : 'Address added');
      onOpenChange();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save address');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim() || !referenceCode.trim() || !addressText.trim()) {
      toast.error('Country, reference code, and address are required');
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add Shipping Address'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. usa, uk, china" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input id="label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. USA - Air Cargo, USA - Sea Cargo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref">Reference Code</Label>
            <Input id="ref" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} placeholder="e.g. Nectarine Your Name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr">Address</Label>
            <Textarea id="addr" value={addressText} onChange={e => setAddressText(e.target.value)} rows={4} placeholder="Full warehouse address" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instr">Instructions (optional)</Label>
            <Textarea id="instr" value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} placeholder="Special instructions for this address" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onOpenChange}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : address ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingAddressFormDialog;
