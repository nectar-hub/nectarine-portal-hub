import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { PurchaseTrackerGrid } from '@/components/purchase-tracker/PurchaseTrackerGrid';
import { PurchaseTrackerToolbar } from '@/components/purchase-tracker/PurchaseTrackerToolbar';
import { PurchaseTracker as PurchaseTrackerType } from '@/types/purchase-tracker';
import { Loader2 } from 'lucide-react';
import ErrorState from '@/components/admin/ErrorState';

const PurchaseTracker = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Fetch purchases (no join; we'll map client_name separately)
  const { data: purchases = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchase-tracker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_tracker')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return (data || []) as PurchaseTrackerType[];
    },
    enabled: isAdmin,
  });

  // Fetch clients for filter dropdown
  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ['air-cargo-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('air_cargo_clients')
        .select('id, client_name')
        .order('client_name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Map clients for fast lookup and enrich purchases with client_name
  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of clients) map[c.id] = c.client_name;
    return map;
  }, [clients]);

  const purchasesWithClients = useMemo(() => {
    return purchases.map((p) => ({ ...p, client_name: clientMap[p.client_id] || 'Unknown' }));
  }, [purchases, clientMap]);

  // Filter purchases

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchasesWithClients.filter((purchase) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        purchase.item_description?.toLowerCase().includes(searchLower) ||
        purchase.invoice_no?.toLowerCase().includes(searchLower) ||
        purchase.store_name?.toLowerCase().includes(searchLower) ||
        purchase.remarks?.toLowerCase().includes(searchLower) ||
        purchase.client_name?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

      // Region filter
      const matchesRegion = regionFilter === 'all' || purchase.from_region === regionFilter;

      // Client filter
      const matchesClient = clientFilter === 'all' || purchase.client_id === clientFilter;

      // Date range filter
      const invoiceDate = new Date(purchase.invoice_date);
      const matchesDateRange = 
        (!dateRange.from || invoiceDate >= dateRange.from) &&
        (!dateRange.to || invoiceDate <= dateRange.to);

      return matchesSearch && matchesStatus && matchesRegion && matchesClient && matchesDateRange;
    });
  }, [purchasesWithClients, searchQuery, statusFilter, regionFilter, clientFilter, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalQty = filteredPurchases.reduce((sum, p) => sum + (p.qty || 0), 0);
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { totalQty, totalAmount };
  }, [filteredPurchases]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-destructive">Access denied. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Failed to load purchases"
          message={(error as any)?.message || 'An unexpected error occurred.'}
          onRetry={() => refetch()}
        />
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 h-full flex flex-col">
        <PageHeader
          title="Purchase Tracker"
          description="Excel-style purchase tracking with client management"
        />

        <Card className="flex-1 flex flex-col overflow-hidden">
          <PurchaseTrackerToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            regionFilter={regionFilter}
            onRegionFilterChange={setRegionFilter}
            clientFilter={clientFilter}
            onClientFilterChange={setClientFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            clients={clients}
            purchases={filteredPurchases}
            totals={totals}
            onRefresh={refetch}
          />

          <div className="flex-1 min-h-0">
            <PurchaseTrackerGrid
              purchases={filteredPurchases}
              clients={clients}
              onRefresh={() => {
                refetch();
                refetchClients();
              }}
            />
          </div>

          {/* Footer with totals */}
          <div className="border-t px-4 py-3 bg-muted/30">
            <div className="flex gap-8 text-sm">
              <div>
                <span className="font-medium">Total Records:</span>{' '}
                <span className="text-primary font-bold">{filteredPurchases.length}</span>
              </div>
              <div>
                <span className="font-medium">Total Qty:</span>{' '}
                <span className="text-primary font-bold">{totals.totalQty}</span>
              </div>
              <div>
                <span className="font-medium">Total Amount:</span>{' '}
                <span className="text-primary font-bold">{totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseTracker;
