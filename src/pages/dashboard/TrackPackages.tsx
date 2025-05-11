
import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

const TrackPackages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber || !courier) {
      toast({
        title: "Error",
        description: "Please enter both tracking number and courier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // In a real app, this would call an API to track the package
    setTimeout(() => {
      toast({
        title: "Tracking Information",
        description: `Tracking ${trackingNumber} with ${courier}. This is a placeholder for actual tracking functionality.`,
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Track My Packages</h1>
          <p className="text-muted-foreground mt-1">Track your packages from different couriers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5 text-nectarine-600" />
                Package Tracking
              </CardTitle>
              <CardDescription>Enter your tracking information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrack} className="space-y-4">
                <div>
                  <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                
                <div>
                  <label htmlFor="courier" className="block text-sm font-medium text-gray-700 mb-1">
                    Courier
                  </label>
                  <Input
                    id="courier" 
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="Enter courier name (DHL, FedEx, etc.)"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Tracking..." : "Track Package"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-nectarine-600" />
                Recent Packages
              </CardTitle>
              <CardDescription>Your recent tracked packages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-muted-foreground">No recent tracked packages</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your recently tracked packages will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrackPackages;
