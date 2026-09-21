import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductionCostWithConsignment, ConsignmentWithWeights, ForeignCurrencyType } from '@/types/production-cost';
import { compareConsignmentTitlesAsc } from '@/lib/consignment-date';

export const useProductionCosts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all production costs with consignment details and weights from the DB view
  const { data: productionCosts, isLoading, error, refetch } = useQuery({
    queryKey: ['production-costs'],
    queryFn: async () => {
      // Fetch production costs with consignment info
      const { data: costs, error: costsError } = await supabase
        .from('production_costs')
        .select(`
          *,
          consignment:air_cargo_consignments(id, consignment_name)
        `)
        .order('cost_date', { ascending: false });

      if (costsError) throw costsError;

      // Fetch aggregated weights from the database view (no pagination issues)
      const { data: weights, error: weightsError } = await supabase
        .from('air_cargo_consignment_weights')
        .select('consignment_id, total_dead_weight, total_volumetric_weight, total_chargeable_weight');

      if (weightsError) throw weightsError;

      // Build lookup map
      const weightsByConsignment: Record<string, { dead: number; volumetric: number; chargeable: number }> = {};
      weights?.forEach((w) => {
        weightsByConsignment[w.consignment_id] = {
          dead: Number(w.total_dead_weight) || 0,
          volumetric: Number(w.total_volumetric_weight) || 0,
          chargeable: Number(w.total_chargeable_weight) || 0,
        };
      });

      // Combine data
      const enrichedCosts: ProductionCostWithConsignment[] = (costs || []).map((cost) => ({
        ...cost,
        currency: cost.currency as ForeignCurrencyType,
        revenue_total: Number(cost.revenue_total) || 0,
        
        total_dead_weight: weightsByConsignment[cost.consignment_id]?.dead || 0,
        total_volumetric_weight: weightsByConsignment[cost.consignment_id]?.volumetric || 0,
        total_chargeable_weight: weightsByConsignment[cost.consignment_id]?.chargeable || 0,
      }));

      // Order by the date inside the consignment title (oldest first)
      enrichedCosts.sort((a, b) =>
        compareConsignmentTitlesAsc(a.consignment?.consignment_name, b.consignment?.consignment_name)
      );

      return enrichedCosts;
    },
  });

  // Fetch consignments for dropdown (with weights from the DB view)
  const { data: consignments } = useQuery({
    queryKey: ['consignments-for-costs'],
    queryFn: async () => {
      const { data: cons, error: consError } = await supabase
        .from('air_cargo_consignments')
        .select('id, consignment_name')
        .order('created_at', { ascending: false });

      if (consError) throw consError;

      // Fetch aggregated weights from the database view
      const { data: weights, error: weightsError } = await supabase
        .from('air_cargo_consignment_weights')
        .select('consignment_id, total_dead_weight, total_volumetric_weight, total_chargeable_weight');

      if (weightsError) throw weightsError;

      // Build lookup map
      const weightsByConsignment: Record<string, { dead: number; volumetric: number; chargeable: number }> = {};
      weights?.forEach((w) => {
        weightsByConsignment[w.consignment_id] = {
          dead: Number(w.total_dead_weight) || 0,
          volumetric: Number(w.total_volumetric_weight) || 0,
          chargeable: Number(w.total_chargeable_weight) || 0,
        };
      });

      const result: ConsignmentWithWeights[] = (cons || []).map((c) => ({
        id: c.id,
        consignment_name: c.consignment_name,
        total_dead_weight: weightsByConsignment[c.id]?.dead || 0,
        total_volumetric_weight: weightsByConsignment[c.id]?.volumetric || 0,
        total_chargeable_weight: weightsByConsignment[c.id]?.chargeable || 0,
      }));

      return result;
    },
  });

  // Check if consignment already has a production cost
  const checkDuplicate = async (consignmentId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('production_costs')
      .select('id')
      .eq('consignment_id', consignmentId)
      .single();
    return !!data;
  };

  // Create production cost
  const createMutation = useMutation({
    mutationFn: async (data: Omit<ProductionCostWithConsignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'consignment' | 'total_dead_weight' | 'total_volumetric_weight' | 'total_chargeable_weight'>) => {
      const { error } = await supabase.from('production_costs').insert({
        consignment_id: data.consignment_id,
        airline_freight_cost: data.airline_freight_cost,
        office_handling_cost: data.office_handling_cost,
        arrival_clearance_cost: data.arrival_clearance_cost,
        znz_airport_to_ferry_transport_cost: data.znz_airport_to_ferry_transport_cost,
        znz_to_dar_shipping_cost: data.znz_to_dar_shipping_cost,
        dar_clearance_cost: data.dar_clearance_cost,
        dar_ferry_to_office_transport_cost: data.dar_ferry_to_office_transport_cost,
        labour_helpers_cost: data.labour_helpers_cost,
        currency: data.currency,
        notes: data.notes,
        cost_date: data.cost_date,
        revenue_total: data.revenue_total,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-costs'] });
      queryClient.invalidateQueries({ queryKey: ['production-cost-consignment-ids'] });
      toast({ title: 'Success', description: 'Production cost created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update production cost
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProductionCostWithConsignment> & { id: string }) => {
      const { error } = await supabase
        .from('production_costs')
        .update({
          airline_freight_cost: data.airline_freight_cost,
          office_handling_cost: data.office_handling_cost,
          arrival_clearance_cost: data.arrival_clearance_cost,
          znz_airport_to_ferry_transport_cost: data.znz_airport_to_ferry_transport_cost,
          znz_to_dar_shipping_cost: data.znz_to_dar_shipping_cost,
          dar_clearance_cost: data.dar_clearance_cost,
          dar_ferry_to_office_transport_cost: data.dar_ferry_to_office_transport_cost,
          labour_helpers_cost: data.labour_helpers_cost,
          currency: data.currency,
          notes: data.notes,
          cost_date: data.cost_date,
          revenue_total: data.revenue_total,
          
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-costs'] });
      queryClient.invalidateQueries({ queryKey: ['production-cost-consignment-ids'] });
      toast({ title: 'Success', description: 'Production cost updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete production cost
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('production_costs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-costs'] });
      queryClient.invalidateQueries({ queryKey: ['production-cost-consignment-ids'] });
      toast({ title: 'Success', description: 'Production cost deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    productionCosts,
    consignments,
    isLoading,
    error,
    refetch,
    checkDuplicate,
    createCost: createMutation.mutate,
    updateCost: updateMutation.mutate,
    deleteCost: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
