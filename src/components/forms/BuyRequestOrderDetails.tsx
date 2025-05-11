
import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface BuyRequestOrderDetailsProps {
  form: UseFormReturn<{
    notes?: string | undefined;
    screenshot?: FileList | undefined;
  }>;
}

export function BuyRequestOrderDetails({ form }: BuyRequestOrderDetailsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Order Details</h3>
      
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
          <FormItem className="mt-4">
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
    </div>
  );
}
