import { useState, useEffect } from 'react';
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
  CURRENCY_OPTIONS,
  CurrencyType,
  calculateTotalCost,
  calculateCostPerKg,
  formatCurrency,
} from '@/types/production-cost';

interface ProductionCostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consignments: ConsignmentWithWeights[];
  existingCostIds: string[];
  editingCost?: ProductionCostWithConsignment;
  onSubmit: (data: Omit<ProductionCostWithConsignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'consignment' | 'total_dead_weight' | 'total_chargeable_weight'>) => void;
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

  const [formData, setFormData] = useState({
    airline_freight_cost: 0,
    office_handling_cost: 0,
    arrival_clearance_cost: 0,
    znz_airport_to_ferry_transport_cost: 0,
    znz_to_dar_shipping_cost: 0,
    dar_clearance_cost: 0,
    dar_ferry_to_office_transport_cost: 0,
    labour_helpers_cost: 0,
    currency: 'USD' as CurrencyType,
    notes: '',
    cost_date: new Date(),
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
        currency: editingCost.currency as CurrencyType,
        notes: editingCost.notes || '',
        cost_date: new Date(editingCost.cost_date),
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
      });
      setDuplicateError(false);
    }
  }, [editingCost, consignments, open]);

  const handleConsignmentSelect = (consignment: ConsignmentWithWeights) => {
    setSelectedConsignment(consignment);
    setConsignmentOpen(false);
    // Check for duplicate
    if (!editingCost && existingCostIds.includes(consignment.id)) {
      setDuplicateError(true);
    } else {
      setDuplicateError(false);
    }
  };

  const handleCostChange = (field: keyof typeof formData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const totalCost = calculateTotalCost(formData as any);
  const costPerDeadKg = calculateCostPerKg(totalCost, selectedConsignment?.total_dead_weight || 0);
  const costPerChargeableKg = calculateCostPerKg(totalCost, selectedConsignment?.total_chargeable_weight || 0);

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
    });
  };

  const availableConsignments = consignments.filter(
    (c) => !existingCostIds.includes(c.id) || c.id === editingCost?.consignment_id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCost ? 'Edit Production Cost' : 'Add Production Cost'}</DialogTitle>
          <DialogDescription>
            {editingCost ? 'Update the production cost details for this consignment.' : 'Select a consignment and enter the production costs.'}
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
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Consignment Name</p>
                  <p className="font-medium">{selectedConsignment.consignment_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Dead Weight</p>
                  <p className="font-medium">{selectedConsignment.total_dead_weight.toFixed(2)} kg</p>
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
            {/* Freight & Handling */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Freight & Handling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Airline Freight Cost</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.airline_freight_cost}
                    onChange={(e) => handleCostChange('airline_freight_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Office Handling Cost</Label>
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

            {/* Clearance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Clearance Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Arrival Clearance Cost</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.arrival_clearance_cost}
                    onChange={(e) => handleCostChange('arrival_clearance_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Dar Clearance Cost</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.dar_clearance_cost}
                    onChange={(e) => handleCostChange('dar_clearance_cost', Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Zanzibar Transport & Shipping */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Zanzibar Transport & Shipping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">ZNZ Airport → Ferry</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.znz_airport_to_ferry_transport_cost}
                    onChange={(e) => handleCostChange('znz_airport_to_ferry_transport_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">ZNZ → Dar Shipping</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.znz_to_dar_shipping_cost}
                    onChange={(e) => handleCostChange('znz_to_dar_shipping_cost', Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dar Transport & Labour */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dar Transport & Labour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Dar Ferry → Office</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.dar_ferry_to_office_transport_cost}
                    onChange={(e) => handleCostChange('dar_ferry_to_office_transport_cost', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Labour/Helpers Cost</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
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
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value: CurrencyType) => setFormData((prev) => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
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
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalCost, formData.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost / Dead Kg</p>
                <p className="font-medium">{costPerDeadKg === 'N/A' ? 'N/A' : formatCurrency(Number(costPerDeadKg), formData.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost / Chargeable Kg</p>
                <p className="font-medium">{costPerChargeableKg === 'N/A' ? 'N/A' : formatCurrency(Number(costPerChargeableKg), formData.currency)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
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
