
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { BuyRequestItem } from "@/types/buyRequest";
import { BuyRequestItemForm } from "./BuyRequestItemForm";
import { createBuyRequest } from "@/services/buyRequestService";
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
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

export function BuyRequestForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [items, setItems] = useState<BuyRequestItem[]>([
    {
      id: uuidv4(),
      productName: "",
      productUrl: "",
      quantity: "1",
      productPrice: "",
      color: "",
      size: ""
    }
  ]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: "",
      notes: "",
    },
  });

  const addNewItem = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        productName: "",
        productUrl: "",
        quantity: "1",
        productPrice: "",
        color: "",
        size: ""
      }
    ]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const validateItems = () => {
    // Basic validation for required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName || item.productName.length < 2) {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: Product name must be at least 2 characters`,
          variant: "destructive"
        });
        return false;
      }
      
      try {
        new URL(item.productUrl);
      } catch {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: Please enter a valid URL`,
          variant: "destructive"
        });
        return false;
      }
      
      if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: Quantity must be a positive number`,
          variant: "destructive"
        });
        return false;
      }
      
      if (item.productPrice && (isNaN(Number(item.productPrice)) || Number(item.productPrice) < 0)) {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: Price must be a valid number`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a request",
        variant: "destructive"
      });
      return;
    }

    // Validate items separately since they're not part of the form
    if (!validateItems()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const fullFormValues = {
        ...values,
        items
      };
      
      await createBuyRequest(fullFormValues, user.id);
      
      toast({
        title: "Request submitted",
        description: "Your 'Buy For Me' request has been submitted successfully."
      });
      
      // Reset form after successful submission
      form.reset();
      setItems([{
        id: uuidv4(),
        productName: "",
        productUrl: "",
        quantity: "1",
        productPrice: "",
        color: "",
        size: ""
      }]);
      
      // Redirect to dashboard
      navigate("/dashboard/orders");
      
    } catch (error: any) {
      console.error("[BUY REQUEST FORM] Error submitting form:", error);
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
    <div className="bg-card rounded-lg border border-border p-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Items to Purchase</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <BuyRequestItemForm
                  key={item.id}
                  item={item}
                  index={index}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  isLast={index === items.length - 1}
                  addNewItem={addNewItem}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Order Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    When do you need these items by?
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
  );
}
