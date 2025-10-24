import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import AccessDenied from '@/components/admin/AccessDenied';
import PageHeader from '@/components/admin/PageHeader';
import PurchaseTrackerGrid from '@/components/purchase-tracker/PurchaseTrackerGrid';
import PurchaseTrackerToolbar from '@/components/purchase-tracker/PurchaseTrackerToolbar';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseTracker, PurchaseFilters } from '@/types/purchase-tracker';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toNumber } from '@/utils/number';

const PurchaseTrackerPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PurchaseFilters>({});

  // Fetch purchases with client info
  const { data: purchases = [], isLoading, error } = useQuery({
    queryKey: ['purchase-tracker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_tracker')
        .select(`
          *,
          client:air_cargo_clients(client_name)
        `)
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        client_name: item.client?.client_name || 'Unknown Client',
      })) as PurchaseTracker[];
    },
    enabled: isAdmin,
  });

  // Real-time subscription
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('purchase_tracker_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_tracker',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['purchase-tracker'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  // Apply filters
  const filteredPurchases = useMemo(() => {
    let result = purchases;

    if (filters.dateRange) {
      result = result.filter((p) => {
        const invoiceDate = new Date(p.invoice_date);
        return (
          invoiceDate >= filters.dateRange!.from &&
          invoiceDate <= filters.dateRange!.to
        );
      });
    }

    if (filters.clientId) {
      result = result.filter((p) => p.client_id === filters.clientId);
    }

    if (filters.region) {
      result = result.filter((p) => p.from_region === filters.region);
    }

    if (filters.store) {
      result = result.filter(
        (p) =>
          p.store_name?.toLowerCase().includes(filters.store!.toLowerCase())
      );
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.item_description?.toLowerCase().includes(searchLower) ||
          p.invoice_no?.toLowerCase().includes(searchLower) ||
          p.store_order_no?.toLowerCase().includes(searchLower) ||
          p.remarks?.toLowerCase().includes(searchLower) ||
          p.client_name?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [purchases, filters]);

  // Calculate totals (null-safe)
  const safeFilteredPurchases = Array.isArray(filteredPurchases) ? filteredPurchases : [];

  const totals = useMemo(() => {
    const totalQty = safeFilteredPurchases.reduce((sum, p) => sum + toNumber(p?.qty), 0);
    const totalAmount = safeFilteredPurchases.reduce((sum, p) => sum + toNumber(p?.amount), 0);
    return { totalQty, totalAmount };
  }, [safeFilteredPurchases]);

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load purchase tracker data',
      variant: 'destructive',
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Purchase Tracker"
          description="Manage and track all purchases with Excel-like data entry"
        />

        <PurchaseTrackerToolbar
          filters={filters}
          onFiltersChange={setFilters}
          purchases={filteredPurchases}
          totals={totals}
        />

        <PurchaseTrackerGrid
          purchases={filteredPurchases}
          isLoading={isLoading}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ['purchase-tracker'] })
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default PurchaseTrackerPage;
