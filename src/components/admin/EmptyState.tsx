
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  showClearFilter?: boolean;
  onClearFilter?: () => void;
}

const EmptyState = ({ 
  title = "No requests found", 
  description = "There are no requests that match your current filter.",
  showClearFilter = false,
  onClearFilter
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {showClearFilter && onClearFilter && (
        <Button variant="outline" onClick={onClearFilter}>
          Show All Requests
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
