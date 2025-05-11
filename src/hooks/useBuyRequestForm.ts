
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { BuyRequestFormValues, BuyRequestItem } from "@/types/buyRequest";
import { createBuyRequest } from "@/services/buyRequestService";
import { useAuth } from "@/context/AuthContext";

// Define the form schema to match what BuyRequestOrderDetails expects
const formSchema = z.object({
  notes: z.string().optional(),
  screenshot: z.instanceof(FileList).optional(),
});

export function useBuyRequestForm() {
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
      size: "",
      storeName: ""
    }
  ]);

  // Track which items are open (expanded)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    [items[0].id]: true // First item is open by default
  });

  // Update form with the correct default values matching the schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      screenshot: undefined,
    },
  });

  const addNewItem = () => {
    const newItemId = uuidv4();
    
    // Close all existing items
    const updatedOpenItems: Record<string, boolean> = {};
    items.forEach(item => {
      updatedOpenItems[item.id] = false;
    });
    
    // Open the new item
    updatedOpenItems[newItemId] = true;
    
    setItems([
      ...items,
      {
        id: newItemId,
        productName: "",
        productUrl: "",
        quantity: "1",
        productPrice: "",
        color: "",
        size: "",
        storeName: ""
      }
    ]);
    
    setOpenItems(updatedOpenItems);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      
      // Update the openItems state to remove the deleted item
      const updatedOpenItems = { ...openItems };
      delete updatedOpenItems[items[index].id];
      
      setItems(newItems);
      setOpenItems(updatedOpenItems);
    }
  };
  
  const handleItemOpenChange = (itemId: string, isOpen: boolean) => {
    setOpenItems(prev => ({
      ...prev,
      [itemId]: isOpen
    }));
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
      const fullFormValues: BuyRequestFormValues = {
        items,
        notes: values.notes,
        screenshot: values.screenshot
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

  return {
    form,
    items,
    openItems,
    isSubmitting,
    error,
    addNewItem,
    updateItem,
    removeItem,
    handleItemOpenChange,
    onSubmit,
  };
}
