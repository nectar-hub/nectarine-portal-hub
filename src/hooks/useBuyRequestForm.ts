
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { BuyRequestFormValues, BuyRequestItem } from "@/types/buyRequest";
import { createBuyRequest, updateBuyRequest } from "@/services/buyRequestService";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

// Define the form schema to match what BuyRequestOrderDetails expects
const formSchema = z.object({
  notes: z.string().optional(),
  screenshot: z.instanceof(FileList).optional(),
  country: z.string().optional(), // Add country field to the schema
});

interface UseBuyRequestFormProps {
  editingRequest?: {
    id: string;
    product_name: string;
    product_url?: string;
    store_name?: string;
    quantity: number;
    product_price?: number;
    color?: string;
    size?: string;
    country_of_purchase: string;
    notes?: string;
    screenshot_url?: string;
    items?: Array<{
      id: string;
      product_name: string;
      product_url?: string;
      store_name?: string;
      quantity: number;
      price?: number;
      color?: string;
      size?: string;
    }>;
  };
  onEditComplete?: () => void;
}

export function useBuyRequestForm({ editingRequest, onEditComplete }: UseBuyRequestFormProps = {}) {
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
      notes: editingRequest?.notes || "",
      screenshot: undefined,
      country: editingRequest?.country_of_purchase || "Default",
    },
  });

  // Load editing data when editingRequest changes
  useEffect(() => {
    if (editingRequest) {
      // Build items array from the main request and additional items
      const allItems: BuyRequestItem[] = [
        {
          id: uuidv4(),
          productName: editingRequest.product_name,
          productUrl: editingRequest.product_url || "",
          quantity: String(editingRequest.quantity),
          productPrice: editingRequest.product_price ? String(editingRequest.product_price) : "",
          color: editingRequest.color || "",
          size: editingRequest.size || "",
          storeName: editingRequest.store_name || ""
        }
      ];

      if (editingRequest.items && editingRequest.items.length > 0) {
        editingRequest.items.forEach(item => {
          allItems.push({
            id: uuidv4(),
            productName: item.product_name,
            productUrl: item.product_url || "",
            quantity: String(item.quantity),
            productPrice: item.price ? String(item.price) : "",
            color: item.color || "",
            size: item.size || "",
            storeName: item.store_name || ""
          });
        });
      }

      setItems(allItems);
      
      // Open the first item by default
      const openState: Record<string, boolean> = {};
      openState[allItems[0].id] = true;
      setOpenItems(openState);

      // Update form values
      form.reset({
        notes: editingRequest.notes || "",
        screenshot: undefined,
        country: editingRequest.country_of_purchase || "Default"
      });
    }
  }, [editingRequest]);

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
        screenshot: values.screenshot,
        country: values.country
      };
      
      if (editingRequest) {
        // Update existing request
        await updateBuyRequest(editingRequest.id, fullFormValues, user.id);
        
        toast({
          title: "Request updated",
          description: "Your 'Buy For Me' request has been updated successfully."
        });
        
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // Create new request
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
          size: "",
          storeName: ""
        }]);
        
        // Redirect to dashboard
        navigate("/dashboard/orders");
      }
      
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
