import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { createSelfPurchase, updateSelfPurchase, SelfPurchaseFormValues } from "@/services/selfPurchaseService";

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

interface SelfPurchaseFormProps {
  editingPurchase?: {
    id: string;
    product_type: string;
    store_name: string;
    quantity: number;
    estimated_value?: number;
    tracking_number: string;
    courier: string;
    notes?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SelfPurchaseForm({ editingPurchase, onSuccess, onCancel }: SelfPurchaseFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<SelfPurchaseFormValues>({
    resolver: zodResolver(selfPurchaseSchema),
    defaultValues: {
      product_type: editingPurchase?.product_type || "",
      store_name: editingPurchase?.store_name || "",
      quantity: editingPurchase?.quantity || 1,
      estimated_value: editingPurchase?.estimated_value,
      tracking_number: editingPurchase?.tracking_number || "",
      courier: editingPurchase?.courier || "",
      notes: editingPurchase?.notes || "",
    },
  });

  // Update form when editingPurchase changes
  useEffect(() => {
    if (editingPurchase) {
      form.reset({
        product_type: editingPurchase.product_type,
        store_name: editingPurchase.store_name,
        quantity: editingPurchase.quantity,
        estimated_value: editingPurchase.estimated_value,
        tracking_number: editingPurchase.tracking_number,
        courier: editingPurchase.courier,
        notes: editingPurchase.notes || "",
      });
    }
  }, [editingPurchase, form]);

  const onSubmit = async (values: SelfPurchaseFormValues) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      if (editingPurchase) {
        await updateSelfPurchase(editingPurchase.id, values, user.id);
        toast({
          title: "Success",
          description: "Self purchase updated successfully",
        });
      } else {
        await createSelfPurchase(values, user.id);
        toast({
          title: "Success",
          description: "Self purchase added successfully",
        });
      }

      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save self purchase",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingBag className="mr-2 h-5 w-5 text-nectarine-600" />
          {editingPurchase ? "Edit Self Purchase" : "Add Self Purchase"}
        </CardTitle>
        <CardDescription>
          {editingPurchase 
            ? "Update your self purchase details"
            : "Record items you purchased yourself that need to be shipped"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Products</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        value={field.value || ""}
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
                      <Input placeholder="Enter tracking number" {...field} />
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
                      <Input placeholder="Enter courier name" {...field} />
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
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit">
                {editingPurchase ? "Update Self Purchase" : "Submit Self Purchase"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
