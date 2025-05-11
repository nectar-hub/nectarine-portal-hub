
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const OrdersEmptyState = () => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No orders found</h3>
        <p className="text-muted-foreground mb-6">
          You don't have any orders yet that match your selected filters.
        </p>
        <Button 
          className="nectarine-gradient hover:opacity-90 transition-opacity"
          asChild
        >
          <a href="/dashboard/buy-for-me">Create Your First Order</a>
        </Button>
      </CardContent>
    </Card>
  );
};
