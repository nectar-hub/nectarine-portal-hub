import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, CalendarIcon } from "lucide-react";
import { PurchaseTrackerItem } from "@/types/purchase-tracker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PurchaseItemFormProps {
  item: Partial<PurchaseTrackerItem>;
  index: number;
  onChange: (index: number, field: keyof PurchaseTrackerItem, value: string | number) => void;
  onRemove: (index: number) => void;
  showRemoveButton: boolean;
}

export function PurchaseItemForm({
  item,
  index,
  onChange,
  onRemove,
  showRemoveButton,
}: PurchaseItemFormProps) {
  const dodDate = item.dod ? new Date(item.dod) : undefined;
  const [dodOpen, setDodOpen] = useState(false);
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Item {index + 1}</h4>
        {showRemoveButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Item Description *</Label>
          <Textarea
            value={item.item_description || ""}
            onChange={(e) => onChange(index, "item_description", e.target.value)}
            placeholder="Enter item description"
            required
          />
        </div>

        <div>
          <Label>Quantity *</Label>
          <Input
            type="number"
            min="1"
            value={item.qty || 1}
            onChange={(e) => onChange(index, "qty", parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={item.amount || ""}
            onChange={(e) => onChange(index, "amount", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label>Store Name</Label>
          <Input
            value={item.store_name || ""}
            onChange={(e) => onChange(index, "store_name", e.target.value)}
            placeholder="Enter store name"
          />
        </div>

        <div>
          <Label>Store Order No.</Label>
          <Input
            value={item.store_order_no || ""}
            onChange={(e) => onChange(index, "store_order_no", e.target.value)}
            placeholder="Enter order number"
          />
        </div>

        <div className="col-span-2">
          <Label>Source Link</Label>
          <Input
            type="url"
            value={item.source_link || ""}
            onChange={(e) => onChange(index, "source_link", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Date of Delivery</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "pl-3 text-left font-normal",
                  !dodDate && "text-muted-foreground"
                )}
              >
                {dodDate ? format(dodDate, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dodDate}
                onSelect={(date) => {
                  onChange(index, "dod", date ? format(date, "yyyy-MM-dd") : "");
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
