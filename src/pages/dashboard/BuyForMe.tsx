import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  productUrl: z.string().url("Please enter a valid URL"),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  productPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Price must be a valid number",
  }),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  deliveryDeadline: z.date({
    required_error: "Please select a delivery deadline",
  }),
  country: z.string({
    required_error: "Please select a country",
  }),
  notes: z.string().optional(),
  screenshot: z.instanceof(FileList).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const BuyForMe = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productUrl: "",
      quantity: "1",
      productPrice: "",
      storeName: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a request",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let screenshotUrl = null;
    
    try {
      // Handle file upload if there's a screenshot
      if (values.screenshot && values.screenshot.length > 0) {
        const file = values.screenshot[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/buy-requests/${fileName}`;
        
        // TODO: Upload the file to Supabase Storage once it's set up
        // const { data, error } = await supabase.storage
        //   .from("buy-request-screenshots")
        //   .upload(filePath, file);
        
        // if (error) throw error;
        // screenshotUrl = data?.path;
      }

      console.log("[BUY FOR ME] Starting submission process with user_id:", user.id);
      
      // Create buy request with the current user's ID
      const buyRequestData = {
        user_id: user.id,
        product_name: values.productName,
        product_url: values.productUrl,
        quantity: parseInt(values.quantity),
        product_price: parseFloat(values.productPrice),
        store_name: values.storeName,
        delivery_deadline: values.deliveryDeadline.toISOString(),
        screenshot_url: screenshotUrl,
        notes: values.notes,
        country_of_purchase: values.country,
      };
      
      console.log("[BUY FOR ME] Submitting buy request with data:", buyRequestData);
      
      // Step 1: Insert the buy request into the database
      const { data: createdBuyRequest, error: buyRequestError } = await supabase
        .from("buy_requests")
        .insert(buyRequestData)
        .select()
        .single();

      if (buyRequestError) {
        console.error("[BUY FOR ME] Buy request error:", buyRequestError);
        throw new Error(`Buy request error: ${buyRequestError.message || "Unknown error occurred"}`);
      }
      
      if (!createdBuyRequest || !createdBuyRequest.id) {
        throw new Error("Failed to create buy request - no ID returned");
      }
      
      console.log("[BUY FOR ME] Buy request created successfully:", createdBuyRequest);
      
      // Step 2: Try inserting the order with a simplified approach
      const orderData = {
        user_id: user.id,  // Explicitly set user_id
        order_type: "buy_request",
        reference_id: createdBuyRequest.id,
        status: "pending"
      };
      
      console.log("[BUY FOR ME] Creating order with data:", orderData);
      
      // Fixed variable name conflict by changing 'data: orderData' to 'data: createdOrder'
      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select();
      
      if (orderError) {
        console.error("[BUY FOR ME] Order creation error:", orderError);
        
        // Try to get detailed information about the error
        const errorDetails = orderError?.details || orderError?.message || "Unknown error";
        console.log("[BUY FOR ME] Error details:", errorDetails);
        
        // Check if the user is authenticated in Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("[BUY FOR ME] Current session:", sessionData);
        
        throw new Error(`Order creation error: ${orderError.message || "Unknown error occurred"}`);
      }
      
      // Changed from orderData to createdOrder here as well
      console.log("[BUY FOR ME] Order created successfully:", createdOrder);
      
      toast({
        title: "Request submitted",
        description: "Your 'Buy For Me' request has been submitted successfully."
      });
      
      // Reset form after successful submission
      form.reset();
      
      // Redirect to dashboard
      navigate("/dashboard/orders");
      
    } catch (error: any) {
      console.error("[BUY FOR ME] Error submitting form:", error);
      setError(error.message || "There was an error submitting your request. Please try again.");
      toast({
        title: "Submission failed",
        description: error.message || "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buy For Me Request</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the form below to request us to purchase an item for you.
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Link to the product on the store's website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Price (Estimate)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storeName"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="deliveryDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Delivery Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When do you need this item by?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Purchase</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="usa">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="china">China</SelectItem>
                          <SelectItem value="uae">UAE</SelectItem>
                          <SelectItem value="germany">Germany</SelectItem>
                          <SelectItem value="japan">Japan</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Notes/Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requirements or details about this purchase"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="screenshot"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Upload Screenshot/Invoice (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        {...fieldProps}
                        onChange={(e) => onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a screenshot of the product or invoice
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="nectarine-gradient hover:opacity-90 transition-opacity"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuyForMe;
