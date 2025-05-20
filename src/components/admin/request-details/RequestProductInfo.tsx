
import { Request, RequestItem } from "@/types/request";
import { SingleItemDetails } from "./SingleItemDetails";
import { MultiItemAccordion } from "./MultiItemAccordion";

interface RequestProductInfoProps {
  request: Request;
}

export const RequestProductInfo = ({ request }: RequestProductInfoProps) => {
  // Fix the logic for checking multiple items - items array should have length > 0
  const hasMultipleItems = Array.isArray(request.items) && request.items.length > 0;
  
  console.log("Request items:", request.items);
  console.log("Has multiple items:", hasMultipleItems);

  return (
    <div className="border-t pt-4">
      <h3 className="text-lg font-medium mb-4">
        {hasMultipleItems ? 'Items' : 'Product Information'}
      </h3>
      
      {hasMultipleItems ? (
        <MultiItemAccordion items={request.items!} country={request.country} />
      ) : (
        <SingleItemDetails request={request} />
      )}
    </div>
  );
};
