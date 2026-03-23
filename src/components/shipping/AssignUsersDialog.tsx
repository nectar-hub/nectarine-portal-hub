import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: () => void;
  addressId: string | null;
}

const AssignUsersDialog = ({ open, onOpenChange, addressId }: Props) => {
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: assignedUserIds = [] } = useQuery({
    queryKey: ['address-assignments', addressId],
    queryFn: async () => {
      if (!addressId) return [];
      const { data, error } = await supabase
        .from('user_shipping_addresses')
        .select('user_id')
        .eq('address_id', addressId);
      if (error) throw error;
      return data.map(d => d.user_id);
    },
    enabled: open && !!addressId,
  });

  useEffect(() => {
    setSelectedUsers(new Set(assignedUserIds));
  }, [assignedUserIds]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!addressId) return;
      // Remove all existing assignments
      const { error: delError } = await supabase
        .from('user_shipping_addresses')
        .delete()
        .eq('address_id', addressId);
      if (delError) throw delError;

      // Insert new assignments
      if (selectedUsers.size > 0) {
        const rows = Array.from(selectedUsers).map(userId => ({
          user_id: userId,
          address_id: addressId,
        }));
        const { error: insError } = await supabase
          .from('user_shipping_addresses')
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-assignments', addressId] });
      toast.success('User assignments updated');
      onOpenChange();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update assignments');
    },
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const filtered = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Users to Address</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            ) : filtered.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={selectedUsers.has(p.id)} onCheckedChange={() => toggleUser(p.id)} />
                <div className="text-sm">
                  <div className="font-medium">{p.full_name || 'Unnamed'}</div>
                  <div className="text-muted-foreground text-xs">{p.email}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onOpenChange}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignUsersDialog;
