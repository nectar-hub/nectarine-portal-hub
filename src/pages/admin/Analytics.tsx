
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart,
  Bar, 
  PieChart as RechartsPieChart,
  Pie,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Users, ShoppingCart, Package, DollarSign } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

const Analytics = () => {
  const { isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const { data: analyticsData, loading, error } = useAnalytics(timeRange);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 text-lg text-center max-w-md">
            You don't have permission to view this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analyticsData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Analytics</h1>
          <p className="text-gray-600 text-center max-w-md">
            {error || "Failed to load analytics data. Please try again later."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Key metrics and performance indicators
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Total Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
              <div className="text-sm text-muted-foreground">
                {analyticsData.completedOrders} completed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Active Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
              <div className="text-sm text-muted-foreground">
                registered users
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Total Revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">
                estimated value
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                Pending Requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.pendingRequests}</div>
              <div className="text-sm text-muted-foreground">
                awaiting processing
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-muted-foreground" />
                <CardTitle>Orders Over Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <AreaChart
                data={analyticsData.ordersOverTime}
                width={500}
                height={300}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                <CardTitle>Orders by Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <RechartsPieChart width={500} height={300}>
                <Pie
                  data={analyticsData.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-muted-foreground" />
                <CardTitle>Orders by Country</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <RechartsBarChart
                width={500}
                height={300}
                data={analyticsData.ordersByCountry}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </RechartsBarChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <div className="space-y-4 overflow-y-auto max-h-72">
                {analyticsData.recentActivity.length > 0 ? (
                  analyticsData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type === 'buy_request' ? 'Buy Request' : 'Self Purchase'}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
