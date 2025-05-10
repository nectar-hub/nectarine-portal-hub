
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
import { BarChart2, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

const Analytics = () => {
  const { isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState("month");

  // Mock data for charts
  const orderData = [
    { name: "Jan", value: 12 },
    { name: "Feb", value: 19 },
    { name: "Mar", value: 15 },
    { name: "Apr", value: 27 },
    { name: "May", value: 29 },
    { name: "Jun", value: 35 },
    { name: "Jul", value: 40 },
    { name: "Aug", value: 37 },
    { name: "Sep", value: 45 },
    { name: "Oct", value: 50 },
    { name: "Nov", value: 42 },
    { name: "Dec", value: 48 },
  ];

  const categoryData = [
    { name: "Electronics", value: 35 },
    { name: "Clothing", value: 25 },
    { name: "Books", value: 15 },
    { name: "Home Goods", value: 20 },
    { name: "Other", value: 5 },
  ];

  const countryData = [
    { name: "USA", value: 45 },
    { name: "UK", value: 28 },
    { name: "China", value: 15 },
    { name: "Germany", value: 7 },
    { name: "Other", value: 5 },
  ];

  const revenueData = [
    { name: "Jan", revenue: 1200, profit: 350 },
    { name: "Feb", revenue: 1900, profit: 480 },
    { name: "Mar", revenue: 1500, profit: 420 },
    { name: "Apr", revenue: 2700, profit: 890 },
    { name: "May", revenue: 2900, profit: 980 },
    { name: "Jun", revenue: 3500, profit: 1100 },
  ];

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
          {[
            {
              title: "Total Orders",
              value: "248",
              change: "+12%",
              isPositive: true,
              description: "vs previous period",
            },
            {
              title: "Active Users",
              value: "3,427",
              change: "+8%",
              isPositive: true,
              description: "vs previous period",
            },
            {
              title: "Revenue",
              value: "$24,312",
              change: "+17%",
              isPositive: true,
              description: "vs previous period",
            },
            {
              title: "Avg. Order Value",
              value: "$98.12",
              change: "-2%",
              isPositive: false,
              description: "vs previous period",
            },
          ].map((metric, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardDescription>{metric.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`text-sm flex items-center ${
                  metric.isPositive ? "text-green-600" : "text-red-600"
                }`}>
                  <span>{metric.change}</span>
                  <span className="text-muted-foreground ml-2">{metric.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
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
                data={orderData}
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
                <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
                <CardTitle>Revenue & Profit</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <RechartsLineChart
                width={500}
                height={300}
                data={revenueData}
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
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="profit" stroke="#82ca9d" />
              </RechartsLineChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                <CardTitle>Orders by Category</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <RechartsPieChart width={500} height={300}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
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
                data={countryData}
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
