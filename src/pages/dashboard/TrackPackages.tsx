
import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, Package, Plus, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const selfPurchaseSchema = z.object({
  description: z.string().min(1, "Product description is required"),
  store_name: z.string().min(1, "Store name is required"),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  estimated_value: z.number().positive("Value must be positive").optional(),
  tracking_number: z.string().optional().nullable(),
  courier: z.string().optional().nullable(),
  notes: z.string().optional(),
});

type SelfPurchaseValues = z.infer<typeof selfPurchaseSchema>;

const TrackPackages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);

  const form = useForm<SelfPurchaseValues>({
    resolver: zodResolver(selfPurchaseSchema),
    defaultValues: {
      description: "",
      store_name: "",
      quantity: 1,
      estimated_value: undefined,
      tracking_number: "",
      courier: "",
      notes: "",
    },
  });

  // Fetch self purchases for this user
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

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber || !courier) {
      toast({
        title: "Error",
        description: "Please enter both tracking number and courier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // In a real app, this would call an API to track the package
    setTimeout(() => {
      toast({
        title: "Tracking Information",
        description: `Tracking ${trackingNumber} with ${courier}. This is a placeholder for actual tracking functionality.`,
      });
      setLoading(false);
    }, 1500);
  };

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

      const { error } = await supabase
        .from('self_purchases')
        .insert({
          ...values,
          user_id: user.id,
        });

      if (error) throw error;

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Self Purchases</h1>
            <p className="text-muted-foreground mt-1">Add and track your self purchases</p>
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="store_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
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
                          <FormLabel>Tracking Number (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tracking number if available" {...field} />
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
                          <FormLabel>Courier (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter courier name if available" {...field} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5 text-nectarine-600" />
                Package Tracking
              </CardTitle>
              <CardDescription>Enter your tracking information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrack} className="space-y-4">
                <div>
                  <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                
                <div>
                  <label htmlFor="courier" className="block text-sm font-medium text-gray-700 mb-1">
                    Courier
                  </label>
                  <Input
                    id="courier" 
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="Enter courier name (DHL, FedEx, etc.)"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Tracking..." : "Track Package"}
                </Button>
              </form>
            </CardContent>
          </Card>

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
                    <div key={purchase.id} className="p-3 border rounded-md">
                      <div className="font-medium">{purchase.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchase.store_name} • {purchase.quantity} {purchase.quantity > 1 ? 'items' : 'item'}
                      </div>
                      <div className="text-sm mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs 
                        ${purchase.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                          purchase.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          purchase.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                          {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
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
      </div>
    </DashboardLayout>
  );
};

export default TrackPackages;
