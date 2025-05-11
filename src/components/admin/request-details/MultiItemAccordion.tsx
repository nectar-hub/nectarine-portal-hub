
import { RequestItem } from "@/types/request";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Store, Hash, DollarSign, Link, Palette, Ruler 
} from "lucide-react";
import { RequestPropertyItem } from "./RequestPropertyItem";
import { ProductLink } from "./ProductLink";

interface MultiItemAccordionProps {
  items: RequestItem[];
  country?: string;
}

export const MultiItemAccordion = ({ items, country }: MultiItemAccordionProps) => {
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem key={item.id || index} value={`item-${index}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center justify-between w-full text-left">
                <span className="font-medium">
                  {item.product_name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.price ? `$${Number(item.price).toFixed(2)}` : 'N/A'} × {item.quantity}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RequestPropertyItem
                  icon={Store}
                  label="Store"
                  value={item.store_name || 'N/A'}
                />
                
                <RequestPropertyItem
                  icon={Hash}
                  label="Quantity"
                  value={item.quantity}
                />
                
                {item.price && (
                  <RequestPropertyItem
                    icon={DollarSign}
                    label="Price"
                    value={`$${Number(item.price).toFixed(2)}`}
                  />
                )}
                
                {item.product_url && (
                  <RequestPropertyItem
                    icon={Link}
                    label="Product URL"
                    value={<ProductLink url={item.product_url} />}
                    colSpan
                  />
                )}
                
                {item.color && (
                  <RequestPropertyItem
                    icon={Palette}
                    label="Color"
                    value={item.color}
                  />
                )}
                
                {item.size && (
                  <RequestPropertyItem
                    icon={Ruler}
                    label="Size"
                    value={item.size}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {country && (
        <div className="space-y-2 border-t pt-3">
          <h4 className="text-sm font-medium">Country of Purchase</h4>
          <p>{country}</p>
        </div>
      )}
    </div>
  );
};
