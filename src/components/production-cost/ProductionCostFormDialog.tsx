import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ProductionCostWithConsignment,
  ConsignmentWithWeights,
  FOREIGN_CURRENCY_OPTIONS,
  ForeignCurrencyType,
  
  calculateForeignCosts,
  calculateLocalCosts,
  formatForeignCurrency,
  formatTZS,
} from '@/types/production-cost';

interface ProductionCostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consignments: ConsignmentWithWeights[];
  existingCostIds: string[];
  editingCost?: ProductionCostWithConsignment;
  onSubmit: (data: Omit<ProductionCostWithConsignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'consignment' | 'total_dead_weight' | 'total_volumetric_weight' | 'total_chargeable_weight'>) => void;
  isSubmitting: boolean;
}

export const ProductionCostFormDialog = ({
  open,
  onOpenChange,
  consignments,
  existingCostIds,
  editingCost,
  onSubmit,
  isSubmitting,
}: ProductionCostFormDialogProps) => {
  const [consignmentOpen, setConsignmentOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState<ConsignmentWithWeights | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);

  // Always fetch the authoritative list of consignments that already have a cost
  const { data: usedConsignmentIds } = useQuery({
    queryKey: ['production-cost-consignment-ids'],
    enabled: open,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('production_costs').select('consignment_id');
      if (error) throw error;
      return (data || []).map((r) => r.consignment_id as string);
    },
  });

  const takenIds = useMemo(
    () => new Set([...(existingCostIds || []), ...(usedConsignmentIds || [])]),
    [existingCostIds, usedConsignmentIds]
  );


  const [formData, setFormData] = useState({
    airline_freight_cost: 0,
    office_handling_cost: 0,
    arrival_clearance_cost: 0,
    znz_airport_to_ferry_transport_cost: 0,
    znz_to_dar_shipping_cost: 0,
    dar_clearance_cost: 0,
    dar_ferry_to_office_transport_cost: 0,
    labour_helpers_cost: 0,
    currency: 'USD' as ForeignCurrencyType,
    notes: '',
    cost_date: new Date(),
    revenue_total: 0,
  });

  useEffect(() => {
    if (editingCost) {
      const consignment = consignments.find((c) => c.id === editingCost.consignment_id);
      setSelectedConsignment(consignment || null);
      setFormData({
        airline_freight_cost: editingCost.airline_freight_cost,
        office_handling_cost: editingCost.office_handling_cost,
        arrival_clearance_cost: editingCost.arrival_clearance_cost,
        znz_airport_to_ferry_transport_cost: editingCost.znz_airport_to_ferry_transport_cost,
        znz_to_dar_shipping_cost: editingCost.znz_to_dar_shipping_cost,
        dar_clearance_cost: editingCost.dar_clearance_cost,
        dar_ferry_to_office_transport_cost: editingCost.dar_ferry_to_office_transport_cost,
        labour_helpers_cost: editingCost.labour_helpers_cost,
        currency: (editingCost.currency as ForeignCurrencyType) || 'USD',
        notes: editingCost.notes || '',
        cost_date: new Date(editingCost.cost_date),
        revenue_total: Number(editingCost.revenue_total) || 0,
        
      });
      setDuplicateError(false);
    } else {
      setSelectedConsignment(null);
      setFormData({
        airline_freight_cost: 0,
        office_handling_cost: 0,
        arrival_clearance_cost: 0,
        znz_airport_to_ferry_transport_cost: 0,
        znz_to_dar_shipping_cost: 0,
        dar_clearance_cost: 0,
        dar_ferry_to_office_transport_cost: 0,
        labour_helpers_cost: 0,
        currency: 'USD',
        notes: '',
        cost_date: new Date(),
        revenue_total: 0,
        
      });
      setDuplicateError(false);
    }
  }, [editingCost, consignments, open]);

  const handleConsignmentSelect = (consignment: ConsignmentWithWeights) => {
    setSelectedConsignment(consignment);
    setConsignmentOpen(false);
    if (!editingCost && takenIds.has(consignment.id)) {
      setDuplicateError(true);
    } else {
      setDuplicateError(false);
    }
  };

  const handleCostChange = (field: keyof typeof formData, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const foreignTotal = calculateForeignCosts(formData);
  const localTotal = calculateLocalCosts(formData);

  const handleSubmit = () => {
    if (!selectedConsignment || duplicateError) return;

    onSubmit({
      consignment_id: selectedConsignment.id,
      airline_freight_cost: formData.airline_freight_cost,
      office_handling_cost: formData.office_handling_cost,
      arrival_clearance_cost: formData.arrival_clearance_cost,
      znz_airport_to_ferry_transport_cost: formData.znz_airport_to_ferry_transport_cost,
      znz_to_dar_shipping_cost: formData.znz_to_dar_shipping_cost,
      dar_clearance_cost: formData.dar_clearance_cost,
      dar_ferry_to_office_transport_cost: formData.dar_ferry_to_office_transport_cost,
      labour_helpers_cost: formData.labour_helpers_cost,
      currency: formData.currency,
      notes: formData.notes || null,
      cost_date: format(formData.cost_date, 'yyyy-MM-dd'),
      revenue_total: formData.revenue_total,
      
    });
  };

  const availableConsignments = useMemo(
    () =>
      consignments.filter(
        (c) => !takenIds.has(c.id) || c.id === editingCost?.consignment_id
      ),
    [consignments, takenIds, editingCost?.consignment_id]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCost ? 'Edit Production Cost' : 'Add Production Cost'}</DialogTitle>
          <DialogDescription>
            {editingCost ? 'Update the production cost and revenue details.' : 'Select a consignment and enter costs and revenue.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Consignment Selection */}
          <div className="space-y-2">
            <Label>Consignment</Label>
            <Popover open={consignmentOpen} onOpenChange={setConsignmentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={consignmentOpen}
                  className="w-full justify-between"
                  disabled={!!editingCost}
                >
                  {selectedConsignment?.consignment_name || 'Select consignment...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="Search consignment..." />
                  <CommandList>
                    <CommandEmpty>No consignment found.</CommandEmpty>
                    <CommandGroup>
                      {availableConsignments.map((consignment) => (
                        <CommandItem
                          key={consignment.id}
                          value={consignment.consignment_name}
                          onSelect={() => handleConsignmentSelect(consignment)}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedConsignment?.id === consignment.id ? 'opacity-100' : 'opacity-0')} />
                          {consignment.consignment_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {duplicateError && (
              <p className="text-sm text-destructive">Production cost already exists for this consignment.</p>
            )}
          </div>

          {/* Consignment Summary Card (READ-ONLY) */}
          {selectedConsignment && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Consignment Details (Read-Only)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Consignment Name</p>
                  <p className="font-medium">{selectedConsignment.consignment_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Dead Weight</p>
                  <p className="font-medium">{selectedConsignment.total_dead_weight.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Volumetric Weight</p>
                  <p className="font-medium">{selectedConsignment.total_volumetric_weight.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Chargeable Weight</p>
                  <p className="font-medium">{selectedConsignment.total_chargeable_weight.toFixed(2)} kg</p>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Cost Inputs - Grouped */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Freight & Handling (Foreign Currency) */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Freight & Handling
                  <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                    {formData.currency}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Airline Freight Cost ({formData.currency})</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.airline_freight_cost}
                    onChange={(e) => handleCostChange('airline_freight_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Office Handling Cost ({formData.currency})</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.office_handling_cost}
                    onChange={(e) => handleCostChange('office_handling_cost', Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Clearance (TZS) */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Clearance Costs
                  <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded">
                    TZS
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Arrival Clearance Cost (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.arrival_clearance_cost}
                    onChange={(e) => handleCostChange('arrival_clearance_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Dar Clearance Cost (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.dar_clearance_cost}
                    onChange={(e) => handleCostChange('dar_clearance_cost', Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Zanzibar Transport & Shipping (TZS) */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Zanzibar Transport & Shipping
                  <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded">
                    TZS
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">ZNZ Airport → Ferry (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.znz_airport_to_ferry_transport_cost}
                    onChange={(e) => handleCostChange('znz_airport_to_ferry_transport_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">ZNZ → Dar Shipping (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.znz_to_dar_shipping_cost}
                    onChange={(e) => handleCostChange('znz_to_dar_shipping_cost', Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dar Transport & Labour (TZS) */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Dar Transport & Labour
                  <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded">
                    TZS
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Dar Ferry → Office (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.dar_ferry_to_office_transport_cost}
                    onChange={(e) => handleCostChange('dar_ferry_to_office_transport_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Labour/Helpers Cost (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.labour_helpers_cost}
                    onChange={(e) => handleCostChange('labour_helpers_cost', Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Currency, Date, Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Foreign Currency (Freight & Handling)</Label>
              <Select value={formData.currency} onValueChange={(value: ForeignCurrencyType) => setFormData((prev) => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOREIGN_CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cost Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.cost_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.cost_date}
                    onSelect={(date) => {
                      if (date) setFormData((prev) => ({ ...prev, cost_date: date }));
                      setDateOpen(false);
                    }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={1}
              />
            </div>
          </div>

          {/* Live Totals */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Calculated Totals</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Foreign Costs Total</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatForeignCurrency(foreignTotal, formData.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Local Costs Total</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatTZS(localTotal)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedConsignment || duplicateError || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCost ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
