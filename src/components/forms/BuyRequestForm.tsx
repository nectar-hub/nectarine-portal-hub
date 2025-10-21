
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useBuyRequestForm } from "@/hooks/useBuyRequestForm";
import { BuyRequestItemsList } from "./BuyRequestItemsList";
import { BuyRequestOrderDetails } from "./BuyRequestOrderDetails";

interface BuyRequestFormProps {
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

export function BuyRequestForm({ editingRequest, onEditComplete }: BuyRequestFormProps = {}) {
  const {
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
  } = useBuyRequestForm({ editingRequest, onEditComplete });

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <BuyRequestItemsList
            items={items}
            openItems={openItems}
            updateItem={updateItem}
            removeItem={removeItem}
            addNewItem={addNewItem}
            handleItemOpenChange={handleItemOpenChange}
          />

          <BuyRequestOrderDetails form={form} />

          <div className="flex gap-3">
            <Button
              type="submit"
              className="nectarine-gradient hover:opacity-90 transition-opacity flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editingRequest ? "Updating..." : "Submitting...") 
                : (editingRequest ? "Update Request" : "Submit Request")
              }
            </Button>
            {editingRequest && onEditComplete && (
              <Button
                type="button"
                variant="outline"
                onClick={onEditComplete}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
