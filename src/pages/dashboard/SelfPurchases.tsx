
import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SelfPurchaseDetailsDialog } from "@/components/dashboard/SelfPurchaseDetailsDialog";
import { SelfPurchaseForm } from "@/components/forms/SelfPurchaseForm";


const SelfPurchases = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);

  const { data: selfPurchases, refetch } = useQuery({
    queryKey: ['self_purchases'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('self_purchases')
        .select(`
          id,
          product_type,
          description,
          store_name,
          quantity,
          estimated_value,
          tracking_number,
          courier,
          notes,
          invoice_url,
          status,
          created_at,
          updated_at,
          status_updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Set up real-time subscriptions for self purchases
  useEffect(() => {
    if (!user) return;

    console.log('[CLIENT REALTIME] Setting up self purchases subscription');
    
    const selfPurchasesChannel = supabase
      .channel('user_self_purchases_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'self_purchases',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[CLIENT REALTIME] Self purchase change detected in TrackPackages:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(selfPurchasesChannel);
    };
  }, [user, refetch]);

  const handleFormSuccess = () => {
    setIsAddingPurchase(false);
    setEditingPurchase(null);
    refetch();
  };

  const handleFormCancel = () => {
    setIsAddingPurchase(false);
    setEditingPurchase(null);
  };

  const handlePurchaseClick = (purchase: any) => {
    console.log('[UI] Self purchase clicked', purchase?.id, purchase);
    setSelectedPurchase(purchase);
    setIsDetailsDialogOpen(true);
  };

  const handleEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);
    setIsAddingPurchase(true);
    setIsDetailsDialogOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {editingPurchase ? "Edit Self Purchase" : "Self Purchases"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {editingPurchase 
                ? "Update your self purchase details below"
                : "Add and manage your self-purchased items"
              }
            </p>
            {editingPurchase && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Editing: {editingPurchase.product_type}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPurchase(null);
                    setIsAddingPurchase(false);
                  }}
                  className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                >
                  Cancel Edit
                </Button>
              </div>
            )}
          </div>
          {!editingPurchase && (
            <Button onClick={() => setIsAddingPurchase(!isAddingPurchase)} className="mt-2 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Self Purchase
            </Button>
          )}
        </div>

        {isAddingPurchase && (
          <SelfPurchaseForm
            editingPurchase={editingPurchase}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-nectarine-600" />
              Recent Purchases
            </CardTitle>
            <CardDescription>Your self purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {selfPurchases && selfPurchases.length > 0 ? (
                <div className="space-y-3">
                  {selfPurchases.slice(0, 5).map((purchase) => (
                     <div 
                       key={purchase.id} 
                       className="p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors" 
                       onClick={() => handlePurchaseClick(purchase)}
                     >
                      <div className="font-medium">{purchase.product_type || purchase.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchase.store_name} • {purchase.quantity} {purchase.quantity > 1 ? 'items' : 'item'}
                      </div>
                      {purchase.tracking_number && (
                        <div className="text-sm text-muted-foreground">
                          Tracking: {purchase.tracking_number}
                        </div>
                      )}
                      <div className="text-sm mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs 
                        ${purchase.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                          purchase.status === 'received' ? 'bg-blue-100 text-blue-800' :
                          purchase.status === 'in_transit' ? 'bg-purple-100 text-purple-800' : 
                          purchase.status === 'arrived' ? 'bg-orange-100 text-orange-800' :
                          purchase.status === 'collected' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                          {purchase.status === 'in_transit' ? 'In Transit' : 
                           purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-muted-foreground">No self purchases yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your first self purchase using the button above
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      <SelfPurchaseDetailsDialog
        purchase={selectedPurchase}
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          console.log('[UI] Details dialog open change:', open);
          setIsDetailsDialogOpen(open);
          if (!open) setSelectedPurchase(null);
        }}
        onEdit={handleEditPurchase}
      />
    </DashboardLayout>
  );
};

export default SelfPurchases;
