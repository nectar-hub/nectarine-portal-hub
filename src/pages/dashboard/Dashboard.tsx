
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ClipboardList, Users, BarChart2, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

const Dashboard = () => {
  const { user, profile, isAdmin } = useAuth();
  const { stats, loading } = useDashboardStats(isAdmin ? undefined : user?.id);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'User'}!</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Admin dashboard - Manage all system operations from here."
              : "Manage your shipping and purchasing requests all in one place."}
          </p>
        </div>

        {isAdmin ? (
          // Admin dashboard view
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  Total Users
                </CardTitle>
                <CardDescription>Registered users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.totalUsers}</div>
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full">Manage Users</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <ShoppingCart className="mr-2 h-5 w-5 text-green-600" />
                  Pending Requests
                </CardTitle>
                <CardDescription>Waiting for your approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.pendingRequests}</div>
                <Link to="/admin/requests">
                  <Button variant="outline" className="w-full">View Requests</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BarChart2 className="mr-2 h-5 w-5 text-purple-600" />
                  System Analytics
                </CardTitle>
                <CardDescription>Performance and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">Total Orders: {stats.userTotalOrders}</div>
                <Link to="/admin/analytics">
                  <Button variant="outline" className="w-full">View Analytics</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Regular user dashboard view 
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
                <div className="text-3xl font-bold mb-2">{stats.userBuyRequests}</div>
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
                <div className="text-3xl font-bold mb-2">{stats.userPackagesInTransit}</div>
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
                <div className="text-3xl font-bold mb-2">{stats.userTotalOrders}</div>
                <Link to="/dashboard/orders">
                  <Button variant="outline" className="w-full">View Orders</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isAdmin ? (
            // Admin specific content
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-muted-foreground">No recent activity to display</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                  <CardDescription>Quick administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Link to="/admin/users">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </Link>
                  <Link to="/admin/requests">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Review Purchase Requests
                    </Button>
                  </Link>
                  <Link to="/admin/settings">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          ) : (
            // Regular user dashboard content
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your recent purchase and shipping requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-muted-foreground">No recent orders to display</p>
                    <Link to="/dashboard/buy-for-me" className="mt-4">
                      <Button>Create Your First Order</Button>
                    </Link>
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
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
