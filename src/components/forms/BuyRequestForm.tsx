
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useBuyRequestForm } from "@/hooks/useBuyRequestForm";
import { BuyRequestItemsList } from "./BuyRequestItemsList";
import { BuyRequestOrderDetails } from "./BuyRequestOrderDetails";

export function BuyRequestForm() {
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
  } = useBuyRequestForm();

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
