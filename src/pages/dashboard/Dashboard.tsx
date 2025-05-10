
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, profile } = useAuth();

  // These would come from API calls in a real app
  const stats = {
    pendingBuyRequests: 2,
    packagesInTransit: 3,
    totalOrders: 5,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'User'}!</h1>
          <p className="text-muted-foreground mt-1">
            Manage your shipping and purchasing requests all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-nectarine-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <ShoppingCart className="mr-2 h-5 w-5 text-nectarine-600" />
                Buy For Me Requests
              </CardTitle>
              <CardDescription>Your pending purchase requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.pendingBuyRequests}</div>
              <Link to="/dashboard/buy-for-me">
                <Button variant="outline" className="w-full">Create New Request</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-nectarine-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Package className="mr-2 h-5 w-5 text-nectarine-600" />
                Packages In Transit
              </CardTitle>
              <CardDescription>Packages on the way to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.packagesInTransit}</div>
              <Link to="/dashboard/track-packages">
                <Button variant="outline" className="w-full">Track Packages</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-nectarine-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <ClipboardList className="mr-2 h-5 w-5 text-nectarine-600" />
                Total Orders
              </CardTitle>
              <CardDescription>All your orders with us</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.totalOrders}</div>
              <Link to="/dashboard/orders">
                <Button variant="outline" className="w-full">View Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your recent purchase and shipping requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">
                        {i % 2 === 0 ? "iPhone 15 Pro" : "Nike Air Force 1"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(2023, 5 - i, 10 + i).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      i === 0 
                        ? "bg-yellow-100 text-yellow-800"
                        : i === 1
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {i === 0 
                        ? "Processing"
                        : i === 1
                        ? "In Transit"
                        : "Delivered"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link to="/dashboard/buy-for-me">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Request a Purchase
                </Button>
              </Link>
              <Link to="/dashboard/track-packages">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Add Self Purchase
                </Button>
              </Link>
              <Link to="/dashboard/shipping-address">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  View Shipping Address
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
