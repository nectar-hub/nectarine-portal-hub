
import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Plus, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SelfPurchaseDetailsDialog } from "@/components/dashboard/SelfPurchaseDetailsDialog";

// Schema for self purchase with product type categories
const selfPurchaseSchema = z.object({
  product_type: z.string().min(1, "Product type is required"),
  store_name: z.string().min(1, "Store name is required"),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  estimated_value: z.number().positive("Value must be positive").optional(),
  tracking_number: z.string().min(1, "Tracking number is required"),
  courier: z.string().min(1, "Courier is required"),
  notes: z.string().optional(),
});

// Product type options for the dropdown
const PRODUCT_TYPES = [
  "Cosmetics",
  "Electronics", 
  "Clothing & Fashion",
  "Books & Media",
  "Home & Garden",
  "Sports & Outdoors",
  "Health & Wellness",
  "Toys & Games",
  "Food & Beverages",
  "Other"
];

type SelfPurchaseValues = z.infer<typeof selfPurchaseSchema>;

const SelfPurchases = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const form = useForm<SelfPurchaseValues>({
    resolver: zodResolver(selfPurchaseSchema),
    defaultValues: {
      product_type: "",
      store_name: "",
      quantity: 1,
      estimated_value: undefined,
      tracking_number: "",
      courier: "",
      notes: "",
    },
  });

  const { data: selfPurchases, refetch } = useQuery({
    queryKey: ['self_purchases'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('self_purchases')
        .select('*')
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

  const onSubmitSelfPurchase = async (values: SelfPurchaseValues) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a self purchase",
          variant: "destructive",
        });
        return;
      }

      // Insert the self purchase first  
      const { data: createdSelfPurchase, error } = await supabase
        .from('self_purchases')
        .insert({
          user_id: user.id,
          product_type: values.product_type,
          description: values.product_type, // Use product_type as description for compatibility
          store_name: values.store_name,
          quantity: values.quantity,
          estimated_value: values.estimated_value,
          tracking_number: values.tracking_number,
          courier: values.courier,
          notes: values.notes,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create an order for this self purchase
      if (createdSelfPurchase?.id) {
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            reference_id: createdSelfPurchase.id,
            user_id: user.id,
            order_type: 'self_purchase'
          });

        if (orderError) {
          console.warn('Failed to create order for self purchase:', orderError);
          // Don't throw here since the main self purchase was successful
        }
      }

      toast({
        title: "Success",
        description: "Self purchase added successfully",
      });

      // Reset form and hide form
      form.reset();
      setIsAddingPurchase(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add self purchase",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseClick = (purchase: any) => {
    console.log('[UI] Self purchase clicked', purchase?.id, purchase);
    setSelectedPurchase(purchase);
    setIsDetailsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Self Purchases</h1>
            <p className="text-muted-foreground mt-1">Add and manage your self-purchased items</p>
          </div>
          <Button onClick={() => setIsAddingPurchase(!isAddingPurchase)} className="mt-2 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Self Purchase
          </Button>
        </div>

        {isAddingPurchase && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-nectarine-600" />
                Add Self Purchase
              </CardTitle>
              <CardDescription>
                Record items you purchased yourself that need to be shipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitSelfPurchase)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="product_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Products</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRODUCT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name="store_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store/Shop/Supplier Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter store name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter quantity" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              min={1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Value (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter estimated value" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              step={0.01}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tracking_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tracking Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tracking number" required {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="courier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Courier</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter courier name" required {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Any additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddingPurchase(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Submit Self Purchase
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
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
      />
    </DashboardLayout>
  );
};

export default SelfPurchases;
