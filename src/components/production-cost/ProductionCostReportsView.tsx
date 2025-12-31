import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { ProductionCostReportsFilters } from './ProductionCostReportsFilters';
import {
  ProductionCostWithConsignment,
  ForeignCurrencyType,
  calculateForeignCosts,
  calculateLocalCosts,
  formatForeignCurrency,
  formatTZS,
} from '@/types/production-cost';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];
const PROFIT_COLORS = {
  positive: 'hsl(142, 76%, 36%)',
  negative: 'hsl(0, 84%, 60%)',
};

export function ProductionCostReportsView() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  // Fetch production costs with consignment data
  const { data: productionCosts, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['production-costs-report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_costs')
        .select(`
          *,
          consignment:air_cargo_consignments(id, consignment_name, consignment_number)
        `)
        .gte('cost_date', format(startDate, 'yyyy-MM-dd'))
        .lte('cost_date', format(endDate, 'yyyy-MM-dd'))
        .order('cost_date', { ascending: false });

      if (error) throw error;

      // Fetch weights for each consignment
      const consignmentIds = data.map(c => c.consignment_id).filter(Boolean);
      const { data: weightsData } = await supabase
        .from('air_cargo_consignment_weights')
        .select('*')
        .in('consignment_id', consignmentIds);

      const weightsMap = new Map(weightsData?.map(w => [w.consignment_id, w]) || []);

      return data.map(cost => ({
        ...cost,
        total_dead_weight: weightsMap.get(cost.consignment_id)?.total_dead_weight || null,
        total_volumetric_weight: weightsMap.get(cost.consignment_id)?.total_volumetric_weight || null,
        total_chargeable_weight: weightsMap.get(cost.consignment_id)?.total_chargeable_weight || null,
      })) as ProductionCostWithConsignment[];
    },
  });

  // Fetch exchange rates for TZS conversions
  const { data: exchangeRates } = useQuery({
    queryKey: ['exchange-rates-for-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('quote_currency', 'TZS')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  // Helper to get exchange rate for a currency and date
  const getExchangeRate = (currency: string, costDate: string): number | null => {
    if (!exchangeRates) return null;
    
    const rate = exchangeRates.find(r => 
      r.base_currency === currency &&
      r.effective_from <= costDate &&
      (r.effective_to === null || r.effective_to >= costDate)
    );
    
    return rate?.rate || null;
  };

  // Calculate aggregated data
  const aggregatedData = useMemo(() => {
    if (!productionCosts) return null;

    const byCurrency: Record<string, {
      count: number;
      totalForeignCosts: number;
      totalLocalCosts: number;
      totalLocalCostsTZS: number;
      totalRevenue: number;
      totalProfit: number;
      margins: number[];
    }> = {};

    const byMonth: Record<string, {
      count: number;
      totalRevenueTZS: number;
      totalCostsTZS: number;
      totalProfitTZS: number;
      margins: number[];
    }> = {};

    let totalRecords = 0;
    let overallTotalProfit = 0;
    let overallTotalRevenue = 0;
    let overallMargins: number[] = [];

    productionCosts.forEach(cost => {
      const currency = cost.currency as ForeignCurrencyType;
      const foreignCosts = calculateForeignCosts(cost);
      const localCostsTZS = calculateLocalCosts(cost);
      const revenue = cost.revenue_total || 0;
      
      // Get exchange rate for conversion
      const rate = getExchangeRate(currency, cost.cost_date);
      const localCostsConverted = rate ? localCostsTZS / rate : 0;
      const totalCosts = foreignCosts + localCostsConverted;
      const profit = revenue - totalCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // Aggregate by currency
      if (!byCurrency[currency]) {
        byCurrency[currency] = {
          count: 0,
          totalForeignCosts: 0,
          totalLocalCosts: 0,
          totalLocalCostsTZS: 0,
          totalRevenue: 0,
          totalProfit: 0,
          margins: [],
        };
      }
      byCurrency[currency].count++;
      byCurrency[currency].totalForeignCosts += foreignCosts;
      byCurrency[currency].totalLocalCosts += localCostsConverted;
      byCurrency[currency].totalLocalCostsTZS += localCostsTZS;
      byCurrency[currency].totalRevenue += revenue;
      byCurrency[currency].totalProfit += profit;
      byCurrency[currency].margins.push(margin);

      // Aggregate by month - convert to TZS for unified totals
      const monthKey = format(new Date(cost.cost_date), 'yyyy-MM');
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          count: 0,
          totalRevenueTZS: 0,
          totalCostsTZS: 0,
          totalProfitTZS: 0,
          margins: [],
        };
      }
      byMonth[monthKey].count++;
      // Convert revenue, costs and profit to TZS using the exchange rate
      const revenueTZS = rate ? revenue * rate : 0;
      const costsTZS = rate ? totalCosts * rate : 0;
      const profitTZS = rate ? profit * rate : 0;
      byMonth[monthKey].totalRevenueTZS += revenueTZS;
      byMonth[monthKey].totalCostsTZS += costsTZS;
      byMonth[monthKey].totalProfitTZS += profitTZS;
      byMonth[monthKey].margins.push(margin);

      // Overall totals
      totalRecords++;
      overallTotalRevenue += revenue;
      overallTotalProfit += profit;
      overallMargins.push(margin);
    });

    const avgMargin = overallMargins.length > 0
      ? overallMargins.reduce((a, b) => a + b, 0) / overallMargins.length
      : 0;

    return {
      totalRecords,
      overallTotalRevenue,
      overallTotalProfit,
      avgMargin,
      byCurrency,
      byMonth,
    };
  }, [productionCosts, exchangeRates]);

  const handleFilterChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (isLoadingCosts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductionCostReportsFilters onFilterChange={handleFilterChange} />

      {/* Date Range Display */}
      <div className="text-sm text-muted-foreground">
        Showing data from {format(startDate, 'PPP')} to {format(endDate, 'PPP')}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consignments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData?.totalRecords || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {aggregatedData && Object.entries(aggregatedData.byCurrency).map(([currency, data]) => (
                <div key={currency} className="text-lg font-bold">
                  {formatForeignCurrency(data.totalRevenue, currency as ForeignCurrencyType)}
                </div>
              ))}
              {(!aggregatedData || Object.keys(aggregatedData.byCurrency).length === 0) && (
                <div className="text-2xl font-bold">$0.00</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            {(aggregatedData?.overallTotalProfit || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {aggregatedData && Object.entries(aggregatedData.byCurrency).map(([currency, data]) => (
                <div
                  key={currency}
                  className={`text-lg font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatForeignCurrency(data.totalProfit, currency as ForeignCurrencyType)}
                </div>
              ))}
              {(!aggregatedData || Object.keys(aggregatedData.byCurrency).length === 0) && (
                <div className="text-2xl font-bold">$0.00</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(aggregatedData?.avgMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(aggregatedData?.avgMargin || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cost Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown (Foreign vs Local)</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregatedData && Object.keys(aggregatedData.byCurrency).length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(aggregatedData.byCurrency).flatMap(([currency, data]) => [
                        {
                          name: `Foreign (${currency})`,
                          value: data.totalForeignCosts,
                          currency,
                        },
                        {
                          name: `Local (${currency})`,
                          value: data.totalLocalCosts,
                          currency,
                        },
                      ]).filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {Object.entries(aggregatedData.byCurrency).flatMap((_, index) => [
                        <Cell key={`foreign-${index}`} fill={CHART_COLORS[0]} />,
                        <Cell key={`local-${index}`} fill={CHART_COLORS[1]} />,
                      ])}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const currency = name.includes('USD') ? 'USD' : name.includes('EUR') ? 'EUR' : 'GBP';
                        return [formatForeignCurrency(value, currency as ForeignCurrencyType), name];
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No cost data for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Profit Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregatedData && Object.keys(aggregatedData.byMonth).length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(aggregatedData.byMonth)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([monthKey, data]) => ({
                        month: format(new Date(monthKey + '-01'), 'MMM yyyy'),
                        profit: data.totalProfitTZS,
                        fill: data.totalProfitTZS >= 0 ? PROFIT_COLORS.positive : PROFIT_COLORS.negative,
                      }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatTZS(value), 'Profit (TZS)']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar
                      dataKey="profit"
                      radius={[4, 4, 0, 0]}
                    >
                      {Object.entries(aggregatedData.byMonth)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([monthKey, data], index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={data.totalProfitTZS >= 0 ? PROFIT_COLORS.positive : PROFIT_COLORS.negative}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No profit data for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue vs Costs Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Costs (TZS)</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregatedData && Object.keys(aggregatedData.byMonth).length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={Object.entries(aggregatedData.byMonth)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([monthKey, data]) => ({
                        month: format(new Date(monthKey + '-01'), 'MMM yyyy'),
                        revenue: data.totalRevenueTZS,
                        costs: data.totalCostsTZS,
                      }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatTZS(value), name === 'revenue' ? 'Revenue' : 'Costs']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend formatter={(value) => value === 'revenue' ? 'Revenue' : 'Costs'} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="costs" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Margin Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Margin Trend (%)</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregatedData && Object.keys(aggregatedData.byMonth).length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Object.entries(aggregatedData.byMonth)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([monthKey, data]) => {
                        const avgMargin = data.margins.length > 0
                          ? data.margins.reduce((a, b) => a + b, 0) / data.margins.length
                          : 0;
                        return {
                          month: format(new Date(monthKey + '-01'), 'MMM yyyy'),
                          margin: avgMargin,
                        };
                      })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => value.toFixed(0) + '%'}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(value: number) => [value.toFixed(1) + '%', 'Avg Margin']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="margin"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No margin data for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By Currency Table */}
      <Card>
        <CardHeader>
          <CardTitle>Summary by Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Foreign Costs</TableHead>
                <TableHead className="text-right">Local Costs (TZS)</TableHead>
                <TableHead className="text-right">Local Costs (Converted)</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Avg Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedData && Object.entries(aggregatedData.byCurrency).map(([currency, data]) => {
                const avgMargin = data.margins.length > 0
                  ? data.margins.reduce((a, b) => a + b, 0) / data.margins.length
                  : 0;
                return (
                  <TableRow key={currency}>
                    <TableCell className="font-medium">{currency}</TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right">
                      {formatForeignCurrency(data.totalForeignCosts, currency as ForeignCurrencyType)}
                    </TableCell>
                    <TableCell className="text-right">{formatTZS(data.totalLocalCostsTZS)}</TableCell>
                    <TableCell className="text-right">
                      {formatForeignCurrency(data.totalLocalCosts, currency as ForeignCurrencyType)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatForeignCurrency(data.totalRevenue, currency as ForeignCurrencyType)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatForeignCurrency(data.totalProfit, currency as ForeignCurrencyType)}
                    </TableCell>
                    <TableCell className={`text-right ${avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {avgMargin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!aggregatedData || Object.keys(aggregatedData.byCurrency).length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No data for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* By Month Table */}
      <Card>
        <CardHeader>
          <CardTitle>Summary by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Avg Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedData && Object.entries(aggregatedData.byMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, data]) => {
                  const avgMargin = data.margins.length > 0
                    ? data.margins.reduce((a, b) => a + b, 0) / data.margins.length
                    : 0;
                  return (
                    <TableRow key={monthKey}>
                      <TableCell className="font-medium">
                        {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                      <TableCell className="text-right">
                        {formatTZS(data.totalRevenueTZS)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${data.totalProfitTZS >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatTZS(data.totalProfitTZS)}
                      </TableCell>
                      <TableCell className={`text-right ${avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {avgMargin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              {(!aggregatedData || Object.keys(aggregatedData.byMonth).length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consignment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Foreign Costs</TableHead>
                <TableHead className="text-right">Local Costs (TZS)</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionCosts?.map(cost => {
                const currency = cost.currency as ForeignCurrencyType;
                const foreignCosts = calculateForeignCosts(cost);
                const localCostsTZS = calculateLocalCosts(cost);
                const revenue = cost.revenue_total || 0;
                const rate = getExchangeRate(currency, cost.cost_date);
                const localCostsConverted = rate ? localCostsTZS / rate : 0;
                const totalCosts = foreignCosts + localCostsConverted;
                const profit = revenue - totalCosts;
                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                return (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">
                      {cost.consignment?.consignment_name || '-'}
                    </TableCell>
                    <TableCell>{format(new Date(cost.cost_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{currency}</TableCell>
                    <TableCell className="text-right">
                      {formatForeignCurrency(foreignCosts, currency)}
                    </TableCell>
                    <TableCell className="text-right">{formatTZS(localCostsTZS)}</TableCell>
                    <TableCell className="text-right">
                      {formatForeignCurrency(revenue, currency)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatForeignCurrency(profit, currency)}
                    </TableCell>
                    <TableCell className={`text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!productionCosts || productionCosts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No data for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
