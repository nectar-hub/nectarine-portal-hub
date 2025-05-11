
import React from "react";
import { BuyRequestItem } from "@/types/buyRequest";
import { BuyRequestItemForm } from "./BuyRequestItemForm";

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
  return (
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
            isOpen={!!openItems[item.id]}
            onOpenChange={(isOpen) => handleItemOpenChange(item.id, isOpen)}
          />
        ))}
      </div>
    </div>
  );
}
