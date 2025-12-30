import { useState, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { ProductionCostToolbar } from '@/components/production-cost/ProductionCostToolbar';
import { ProductionCostGrid } from '@/components/production-cost/ProductionCostGrid';
import { ProductionCostFormDialog } from '@/components/production-cost/ProductionCostFormDialog';
import { useProductionCosts } from '@/hooks/useProductionCosts';
import { ProductionCostWithConsignment } from '@/types/production-cost';
import { Loader2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

const ProductionCost = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<ProductionCostWithConsignment | undefined>(undefined);

  const {
    productionCosts,
    consignments,
    isLoading,
    createCost,
    updateCost,
    deleteCost,
    isCreating,
    isUpdating,
  } = useProductionCosts();

  // Filter data
  const filteredData = useMemo(() => {
    if (!productionCosts) return [];

    return productionCosts.filter((cost) => {
      const matchesSearch = !searchQuery || 
        cost.consignment?.consignment_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !dateFilter || 
        isSameDay(new Date(cost.cost_date), dateFilter);

      return matchesSearch && matchesDate;
    });
  }, [productionCosts, searchQuery, dateFilter]);

  // Get IDs of consignments that already have production costs
  const existingCostIds = useMemo(() => {
    return (productionCosts || []).map((c) => c.consignment_id);
  }, [productionCosts]);

  const handleAddClick = () => {
    setEditingCost(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (cost: ProductionCostWithConsignment) => {
    setEditingCost(cost);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCost(id);
  };

  const handleInlineUpdate = (id: string, field: string, value: number) => {
    updateCost({ id, [field]: value });
  };

  const handleFormSubmit = (data: Omit<ProductionCostWithConsignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'consignment' | 'total_dead_weight' | 'total_volumetric_weight' | 'total_chargeable_weight'>) => {
    if (editingCost) {
      updateCost({ id: editingCost.id, ...data });
    } else {
      createCost(data);
    }
    setDialogOpen(false);
    setEditingCost(undefined);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Production Cost"
          description="Manage production and operational costs per air cargo consignment"
        />

        <ProductionCostToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onAddClick={handleAddClick}
          data={filteredData}
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ProductionCostGrid
            data={filteredData}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInlineUpdate={handleInlineUpdate}
          />
        )}

        <ProductionCostFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          consignments={consignments || []}
          existingCostIds={existingCostIds}
          editingCost={editingCost}
          onSubmit={handleFormSubmit}
          isSubmitting={isCreating || isUpdating}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProductionCost;
