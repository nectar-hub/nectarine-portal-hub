
import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface BuyRequestItemFormProps {
  index: number;
  updateItem: (index: number, field: string, value: string) => void;
  removeItem: (index: number) => void;
  productName: string;
  productUrl: string;
  quantity: string;
  productPrice: string;
  color: string;
  size: string;
  storeName: string;
  showRemoveButton: boolean;
}

export function BuyRequestItemForm({
  index,
  updateItem,
  removeItem,
  productName,
  productUrl,
  quantity,
  productPrice,
  color,
  size,
  storeName = "",
  showRemoveButton,
}: BuyRequestItemFormProps) {
  return (
    <div className="space-y-4 border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Item {index + 1}</h4>
        {showRemoveButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => removeItem(index)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor={`item-${index}-product-name`}>
            Product Name *
          </FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-product-name`}
              placeholder="Enter the product name"
              value={productName}
              onChange={(e) => updateItem(index, "productName", e.target.value)}
            />
          </FormControl>
          <FormMessage />
        </div>

        <div>
          <FormLabel htmlFor={`item-${index}-product-url`}>
            Product URL *
          </FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-product-url`}
              placeholder="https://example.com/product"
              value={productUrl}
              onChange={(e) => updateItem(index, "productUrl", e.target.value)}
              type="url"
            />
          </FormControl>
          <FormMessage />
        </div>

        <div>
          <FormLabel htmlFor={`item-${index}-store-name`}>
            Store Name
          </FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-store-name`}
              placeholder="Enter the store name"
              value={storeName}
              onChange={(e) => updateItem(index, "storeName", e.target.value)}
            />
          </FormControl>
          <FormMessage />
        </div>

        <div>
          <FormLabel htmlFor={`item-${index}-quantity`}>Quantity *</FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-quantity`}
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
              type="number"
              min="1"
              step="1"
            />
          </FormControl>
          <FormMessage />
        </div>

        <div>
          <FormLabel htmlFor={`item-${index}-price`}>Price (optional)</FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-price`}
              placeholder="Enter the price"
              value={productPrice}
              onChange={(e) =>
                updateItem(index, "productPrice", e.target.value)
              }
              type="number"
              min="0"
              step="0.01"
            />
          </FormControl>
          <FormMessage />
        </div>

        <div>
          <FormLabel htmlFor={`item-${index}-color`}>
            Color (optional)
          </FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-color`}
              placeholder="Enter the color"
              value={color}
              onChange={(e) => updateItem(index, "color", e.target.value)}
            />
          </FormControl>
          <FormMessage />
        </div>

        <div>
          <FormLabel htmlFor={`item-${index}-size`}>Size (optional)</FormLabel>
          <FormControl>
            <Input
              id={`item-${index}-size`}
              placeholder="Enter the size"
              value={size}
              onChange={(e) => updateItem(index, "size", e.target.value)}
            />
          </FormControl>
          <FormMessage />
        </div>
      </div>
    </div>
  );
}
