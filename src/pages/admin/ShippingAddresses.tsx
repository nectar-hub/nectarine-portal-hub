import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ShippingAddressFormDialog from '@/components/shipping/ShippingAddressFormDialog';
import AssignUsersDialog from '@/components/shipping/AssignUsersDialog';

export type ShippingAddressRow = {
  id: string;
  country: string;
  label: string | null;
  address: string;
  reference_code: string;
  instructions: string | null;
  sort_order: number;
  created_at: string;
};

const ShippingAddresses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddressRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignAddressId, setAssignAddressId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['admin-shipping-addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .order('sort_order')
        .order('country');
      if (error) throw error;
      return data as ShippingAddressRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete assignments first
      const { error: assignError } = await supabase
        .from('user_shipping_addresses')
        .delete()
        .eq('address_id', id);
      if (assignError) throw assignError;

      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-addresses'] });
      toast.success('Address deleted successfully');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });

  const filtered = addresses.filter(a =>
    a.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.reference_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (addr: ShippingAddressRow) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Shipping Addresses"
          description="Manage warehouse shipping addresses and assign them to users"
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No addresses match your search' : 'No shipping addresses yet'}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Order</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Reference Code</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Instructions</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((addr) => (
                      <TableRow key={addr.id}>
                        <TableCell className="font-medium capitalize">{addr.country}</TableCell>
                        <TableCell>{addr.label || '—'}</TableCell>
                        <TableCell>{addr.reference_code}</TableCell>
                        <TableCell className="max-w-xs truncate">{addr.address}</TableCell>
                        <TableCell className="max-w-xs truncate">{addr.instructions || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setAssignAddressId(addr.id)} title="Assign users">
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(addr)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(addr.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <ShippingAddressFormDialog
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          address={editingAddress}
        />

        <AssignUsersDialog
          open={!!assignAddressId}
          onOpenChange={() => setAssignAddressId(null)}
          addressId={assignAddressId}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipping Address?</AlertDialogTitle>
              <AlertDialogDescription>
                This will also remove all user assignments for this address. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default ShippingAddresses;
