
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Update the interface to match the form schema in useBuyRequestForm.ts
interface BuyRequestOrderDetailsProps {
  form: UseFormReturn<{
    notes?: string | undefined;
    screenshot?: FileList | undefined;
    country?: string | undefined;
  }>;
}

export function BuyRequestOrderDetails({ form }: BuyRequestOrderDetailsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Order Details</h3>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country of Purchase</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || "Default"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country of purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Default">Default</SelectItem>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="EU">European Union</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Choose the country where the product should be purchased from
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
            <FormItem>
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
    </div>
  );
}
