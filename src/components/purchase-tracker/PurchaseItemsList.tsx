import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { PurchaseTrackerItem } from "@/types/purchase-tracker";
import { PurchaseItemForm } from "./PurchaseItemForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PurchaseItemsListProps {
  items: Partial<PurchaseTrackerItem>[];
  onChange: (index: number, field: keyof PurchaseTrackerItem, value: string | number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function PurchaseItemsList({
  items,
  onChange,
  onRemove,
  onAdd,
}: PurchaseItemsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Purchase Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-medium text-left">
                  {item.item_description || `Item ${index + 1} (No description)`}
                </span>
                {item.qty && (
                  <span className="text-sm text-muted-foreground">
                    Qty: {item.qty}
                    {item.amount && ` | $${Number(item.amount).toFixed(2)}`}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <PurchaseItemForm
                item={item}
                index={index}
                onChange={onChange}
                onRemove={onRemove}
                showRemoveButton={items.length > 1}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
