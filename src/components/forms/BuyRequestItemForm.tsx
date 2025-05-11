
import React, { useState } from "react";
import { FormControl, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BuyRequestItem } from "@/types/buyRequest";
import { ChevronDown, ChevronUp, Plus, Trash } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BuyRequestItemFormProps {
  item: BuyRequestItem;
  index: number;
  updateItem: (index: number, field: string, value: string) => void;
  removeItem: (index: number) => void;
  isLast: boolean;
  addNewItem: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyRequestItemForm({ 
  item, 
  index, 
  updateItem, 
  removeItem, 
  isLast,
  addNewItem,
  isOpen,
  onOpenChange
}: BuyRequestItemFormProps) {
  return (
    <div className="border border-border rounded-md p-4 mb-4 relative">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-base">Item {index + 1}: {item.productName || "New Item"}</h3>
          
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeItem(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <FormLabel htmlFor={`item-${index}-productName`}>Product Name</FormLabel>
              <FormControl>
                <Input
                  id={`item-${index}-productName`}
                  placeholder="Enter product name"
                  value={item.productName}
                  onChange={(e) => updateItem(index, "productName", e.target.value)}
                />
              </FormControl>
              {!item.productName && item.productName !== "" && (
                <p className="text-sm font-medium text-destructive mt-1">
                  Product name is required
                </p>
              )}
            </div>
            
            <div>
              <FormLabel htmlFor={`item-${index}-productUrl`}>Product URL</FormLabel>
              <FormControl>
                <Input
                  id={`item-${index}-productUrl`}
                  placeholder="https://..."
                  value={item.productUrl}
                  onChange={(e) => updateItem(index, "productUrl", e.target.value)}
                />
              </FormControl>
              {!item.productUrl && item.productUrl !== "" && (
                <p className="text-sm font-medium text-destructive mt-1">
                  Valid URL is required
                </p>
              )}
              <FormDescription>
                Link to the product on the store's website
              </FormDescription>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <FormLabel htmlFor={`item-${index}-quantity`}>Quantity</FormLabel>
              <FormControl>
                <Input
                  id={`item-${index}-quantity`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                />
              </FormControl>
            </div>
            
            <div>
              <FormLabel htmlFor={`item-${index}-productPrice`}>Price (Est.)</FormLabel>
              <FormControl>
                <Input
                  id={`item-${index}-productPrice`}
                  type="number"
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  value={item.productPrice}
                  onChange={(e) => updateItem(index, "productPrice", e.target.value)}
                />
              </FormControl>
            </div>
            
            <div>
              <FormLabel htmlFor={`item-${index}-color`}>Color (Optional)</FormLabel>
              <FormControl>
                <Input
                  id={`item-${index}-color`}
                  placeholder="e.g. Red, Blue"
                  value={item.color || ""}
                  onChange={(e) => updateItem(index, "color", e.target.value)}
                />
              </FormControl>
            </div>
            
            <div>
              <FormLabel htmlFor={`item-${index}-size`}>Size (Optional)</FormLabel>
              <FormControl>
                <Input
                  id={`item-${index}-size`}
                  placeholder="e.g. L, 42, 10"
                  value={item.size || ""}
                  onChange={(e) => updateItem(index, "size", e.target.value)}
                />
              </FormControl>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {isLast && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addNewItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Item
          </Button>
        </div>
      )}
    </div>
  );
}
