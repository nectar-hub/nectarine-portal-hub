
import React from "react";
import { BuyRequestItem } from "@/types/buyRequest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BuyRequestItemForm } from "./BuyRequestItemForm";
import { Plus } from "lucide-react";

interface BuyRequestItemsListProps {
  items: BuyRequestItem[];
  openItems: Record<string, boolean>;
  updateItem: (index: number, field: string, value: string) => void;
  removeItem: (index: number) => void;
  addNewItem: () => void;
  handleItemOpenChange: (itemId: string, isOpen: boolean) => void;
}

export function BuyRequestItemsList({
  items,
  openItems,
  updateItem,
  removeItem,
  addNewItem,
  handleItemOpenChange,
}: BuyRequestItemsListProps) {
  // Function to get the value of an accordion item based on the item ID
  const getAccordionValue = (id: string): string[] => {
    return openItems[id] ? [id] : [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Items to Purchase</h3>
        <Button
          type="button"
          variant="outline"
          onClick={addNewItem}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Accordion
            key={item.id}
            type="single"
            collapsible
            value={getAccordionValue(item.id)[0]}
            onValueChange={(value) =>
              handleItemOpenChange(item.id, value === item.id)
            }
          >
            <AccordionItem value={item.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-left">
                    {item.productName
                      ? item.productName
                      : `Item ${index + 1} (No name yet)`}
                  </span>
                  {item.productPrice && (
                    <span className="text-sm text-muted-foreground">
                      ${item.productPrice} × {item.quantity}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <BuyRequestItemForm
                  index={index}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  productName={item.productName}
                  productUrl={item.productUrl}
                  quantity={item.quantity}
                  productPrice={item.productPrice}
                  color={item.color}
                  size={item.size}
                  storeName={item.storeName || ""}
                  showRemoveButton={items.length > 1}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
