import { useState, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { useProductionCosts } from '@/hooks/useProductionCosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, Search, TrendingUp, TrendingDown, Package, Scale, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  calculateForeignCosts,
  calculateProfit,
  calculateProfitMargin,
  formatForeignCurrency,
  formatTZS,
  ROUTE_OPTIONS,
  FOREIGN_CURRENCY_OPTIONS,
} from '@/types/production-cost';
import { Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Legend, Tooltip, CartesianGrid } from 'recharts';

const CostReports = () => {
  const { productionCosts, isLoading } = useProductionCosts();
  
  // Filters
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Filter data
  const filteredData = useMemo(() => {
    if (!productionCosts) return [];

    return productionCosts.filter((cost) => {
      const costDate = parseISO(cost.cost_date);
      const inDateRange = isWithinInterval(costDate, { start: dateRange.from, end: dateRange.to });
      const matchesSearch = !searchQuery || 
        cost.consignment?.consignment_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRoute = routeFilter === 'all' || cost.route === routeFilter;

      return inDateRange && matchesSearch && matchesRoute;
    });
  }, [productionCosts, dateRange, searchQuery, routeFilter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!filteredData.length) return null;

    let totalDeadWeight = 0;
    let totalChargeableWeight = 0;
    let totalForeignCost = 0;
    let totalLocalCost = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    filteredData.forEach((cost) => {
      totalDeadWeight += Number(cost.total_dead_weight) || 0;
      totalChargeableWeight += Number(cost.total_chargeable_weight) || 0;
      const foreignCost = calculateForeignCosts(cost);
      totalForeignCost += foreignCost;
      totalLocalCost += Number(cost.arrival_clearance_cost) || 0;
      totalLocalCost += Number(cost.znz_airport_to_ferry_transport_cost) || 0;
      totalLocalCost += Number(cost.znz_to_dar_shipping_cost) || 0;
      totalLocalCost += Number(cost.dar_clearance_cost) || 0;
      totalLocalCost += Number(cost.dar_ferry_to_office_transport_cost) || 0;
      totalLocalCost += Number(cost.labour_helpers_cost) || 0;
      const revenue = Number(cost.revenue_total) || 0;
      totalRevenue += revenue;
      totalProfit += calculateProfit(revenue, foreignCost);
    });

    const avgCostPerKg = totalChargeableWeight > 0 ? totalForeignCost / totalChargeableWeight : 0;
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      count: filteredData.length,
      totalDeadWeight,
      totalChargeableWeight,
      totalForeignCost,
      totalLocalCost,
      totalRevenue,
      totalProfit,
      avgCostPerKg,
      avgProfitMargin,
    };
  }, [filteredData]);

  // Route breakdown data
  const routeBreakdown = useMemo(() => {
    if (!filteredData.length) return [];

    const byRoute: Record<string, {
      route: string;
      count: number;
      totalCW: number;
      totalCost: number;
      totalRevenue: number;
      totalProfit: number;
    }> = {};

    filteredData.forEach((cost) => {
      const route = cost.route || 'Unknown';
      if (!byRoute[route]) {
        byRoute[route] = { route, count: 0, totalCW: 0, totalCost: 0, totalRevenue: 0, totalProfit: 0 };
      }
      byRoute[route].count += 1;
      byRoute[route].totalCW += Number(cost.total_chargeable_weight) || 0;
      const foreignCost = calculateForeignCosts(cost);
      byRoute[route].totalCost += foreignCost;
      const revenue = Number(cost.revenue_total) || 0;
      byRoute[route].totalRevenue += revenue;
      byRoute[route].totalProfit += calculateProfit(revenue, foreignCost);
    });

    return Object.values(byRoute).map((r) => ({
      ...r,
      avgCostPerKg: r.totalCW > 0 ? r.totalCost / r.totalCW : 0,
      avgMargin: r.totalRevenue > 0 ? (r.totalProfit / r.totalRevenue) * 100 : 0,
    }));
  }, [filteredData]);

  // Top consignments by cost
  const topByCost = useMemo(() => {
    return [...filteredData]
      .map((c) => ({ ...c, foreignTotal: calculateForeignCosts(c) }))
      .sort((a, b) => b.foreignTotal - a.foreignTotal)
      .slice(0, 10);
  }, [filteredData]);

  // Top consignments by profit
  const topByProfit = useMemo(() => {
    return [...filteredData]
      .map((c) => {
        const foreignTotal = calculateForeignCosts(c);
        const revenue = Number(c.revenue_total) || 0;
        return { ...c, foreignTotal, profit: calculateProfit(revenue, foreignTotal) };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }, [filteredData]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    if (!productionCosts?.length) return [];

    const byMonth: Record<string, { month: string; cost: number; revenue: number; profit: number }> = {};

    productionCosts.forEach((cost) => {
      const monthKey = format(parseISO(cost.cost_date), 'yyyy-MM');
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { month: monthKey, cost: 0, revenue: 0, profit: 0 };
      }
      const foreignCost = calculateForeignCosts(cost);
      const revenue = Number(cost.revenue_total) || 0;
      byMonth[monthKey].cost += foreignCost;
      byMonth[monthKey].revenue += revenue;
      byMonth[monthKey].profit += calculateProfit(revenue, foreignCost);
    });

    return Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((m) => ({
        ...m,
        monthLabel: format(parseISO(m.month + '-01'), 'MMM yy'),
      }));
  }, [productionCosts]);

  // Export functions
  const exportToCSV = () => {
    if (!filteredData.length) return;

    const headers = ['Consignment', 'Route', 'Dead Weight', 'Chargeable Weight', 'Foreign Cost', 'Local Cost (TZS)', 'Revenue', 'Profit', 'Margin %', 'Date'];
    const rows = filteredData.map((cost) => {
      const foreignCost = calculateForeignCosts(cost);
      const revenue = Number(cost.revenue_total) || 0;
      const profit = calculateProfit(revenue, foreignCost);
      return [
        cost.consignment?.consignment_name || '',
        cost.route || '',
        (Number(cost.total_dead_weight) || 0).toFixed(2),
        (Number(cost.total_chargeable_weight) || 0).toFixed(2),
        foreignCost.toFixed(2),
        (Number(cost.arrival_clearance_cost) + Number(cost.znz_airport_to_ferry_transport_cost) + Number(cost.znz_to_dar_shipping_cost) + Number(cost.dar_clearance_cost) + Number(cost.dar_ferry_to_office_transport_cost) + Number(cost.labour_helpers_cost) || 0).toFixed(0),
        revenue.toFixed(2),
        profit.toFixed(2),
        calculateProfitMargin(revenue, profit),
        cost.cost_date,
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const exportToXLSX = () => {
    if (!filteredData.length) return;

    const wsData = filteredData.map((cost) => {
      const foreignCost = calculateForeignCosts(cost);
      const revenue = Number(cost.revenue_total) || 0;
      const profit = calculateProfit(revenue, foreignCost);
      return {
        Consignment: cost.consignment?.consignment_name || '',
        Route: cost.route || '',
        'Dead Weight': Number(cost.total_dead_weight) || 0,
        'Chargeable Weight': Number(cost.total_chargeable_weight) || 0,
        'Foreign Cost': foreignCost,
        'Local Cost (TZS)': Number(cost.arrival_clearance_cost) + Number(cost.znz_airport_to_ferry_transport_cost) + Number(cost.znz_to_dar_shipping_cost) + Number(cost.dar_clearance_cost) + Number(cost.dar_ferry_to_office_transport_cost) + Number(cost.labour_helpers_cost) || 0,
        Revenue: revenue,
        Profit: profit,
        'Margin %': calculateProfitMargin(revenue, profit),
        Date: cost.cost_date,
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cost Report');
    XLSX.writeFile(wb, `cost-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Cost Reports"
          description="Monthly cost analysis, profit tracking, and route-based breakdowns"
        />

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => {
                      if (date) setDateRange((prev) => ({ ...prev, from: date }));
                      setDateFromOpen(false);
                    }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => {
                      if (date) setDateRange((prev) => ({ ...prev, to: date }));
                      setDateToOpen(false);
                    }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Route</Label>
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {ROUTE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Search Consignment</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Consignments</span>
                </div>
                <p className="text-2xl font-bold">{summaryStats.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Dead Wt (kg)</span>
                </div>
                <p className="text-2xl font-bold">{summaryStats.totalDeadWeight.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Chrg Wt (kg)</span>
                </div>
                <p className="text-2xl font-bold">{summaryStats.totalChargeableWeight.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Foreign Cost</span>
                </div>
                <p className="text-xl font-bold text-blue-600">${summaryStats.totalForeignCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Local Cost</span>
                </div>
                <p className="text-lg font-bold text-green-600">TSh {(summaryStats.totalLocalCost / 1000000).toFixed(1)}M</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <p className="text-xl font-bold text-purple-600">${summaryStats.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {summaryStats.totalProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">Total Profit</span>
                </div>
                <p className={cn('text-xl font-bold', summaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                  ${Math.abs(summaryStats.totalProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Margin</span>
                </div>
                <p className={cn('text-xl font-bold', summaryStats.avgProfitMargin >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {summaryStats.avgProfitMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Trend Chart */}
        {monthlyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Monthly Trend (Cost vs Revenue vs Profit)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#3b82f6" name="Cost" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#22c55e" name="Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Breakdown */}
        {routeBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Cost per KG by Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total CW</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Avg $/KG</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Avg Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeBreakdown.map((row) => (
                      <TableRow key={row.route}>
                        <TableCell className="font-medium">{row.route}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right">{row.totalCW.toFixed(0)} kg</TableCell>
                        <TableCell className="text-right">${row.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right font-medium">${row.avgCostPerKg.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${row.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className={cn('text-right', row.totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                          ${Math.abs(row.totalProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className={cn('text-right', row.avgMargin >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {row.avgMargin.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Most Expensive */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top 10 Most Expensive Consignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consignment</TableHead>
                      <TableHead className="text-right">Foreign Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topByCost.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-sm">{row.consignment?.consignment_name || '-'}</TableCell>
                        <TableCell className="text-right text-blue-600">{formatForeignCurrency(row.foreignTotal, row.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Most Profitable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top 10 Most Profitable Consignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consignment</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topByProfit.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-sm">{row.consignment?.consignment_name || '-'}</TableCell>
                        <TableCell className={cn('text-right', row.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatForeignCurrency(row.profit, row.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Buttons */}
        <Card>
          <CardContent className="pt-4 flex gap-4">
            <Button variant="outline" onClick={exportToCSV} disabled={!filteredData.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportToXLSX} disabled={!filteredData.length}>
              <Download className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CostReports;
