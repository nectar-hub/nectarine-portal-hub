import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ProductionCostWithConsignment,
  calculateTotalCost,
  calculateCostPerKg,
  formatCurrency,
  CurrencyType,
} from '@/types/production-cost';
import { format } from 'date-fns';

interface ProductionCostGridProps {
  data: ProductionCostWithConsignment[];
  onEdit: (cost: ProductionCostWithConsignment) => void;
  onDelete: (id: string) => void;
  onInlineUpdate: (id: string, field: string, value: number) => void;
}

export const ProductionCostGrid = ({ data, onEdit, onDelete, onInlineUpdate }: ProductionCostGridProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');

  const costFields = [
    { key: 'airline_freight_cost', label: 'Airline Freight' },
    { key: 'office_handling_cost', label: 'Office Handling' },
    { key: 'arrival_clearance_cost', label: 'Arrival Clearance' },
    { key: 'znz_airport_to_ferry_transport_cost', label: 'ZNZ→Ferry' },
    { key: 'znz_to_dar_shipping_cost', label: 'ZNZ→Dar' },
    { key: 'dar_clearance_cost', label: 'Dar Clearance' },
    { key: 'dar_ferry_to_office_transport_cost', label: 'Dar→Office' },
    { key: 'labour_helpers_cost', label: 'Labour' },
  ];

  const handleCellClick = (id: string, field: string, currentValue: number) => {
    setEditingCell({ id, field });
    setCellValue(currentValue.toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const numValue = Number(cellValue) || 0;
      onInlineUpdate(editingCell.id, editingCell.field, numValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[180px]">Consignment</TableHead>
              <TableHead className="text-right min-w-[100px]">Dead Wt (kg)</TableHead>
              <TableHead className="text-right min-w-[100px]">Chrg Wt (kg)</TableHead>
              {costFields.map((field) => (
                <TableHead key={field.key} className="text-right min-w-[100px]">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[100px] bg-primary/5">Total</TableHead>
              <TableHead className="text-right min-w-[100px] bg-primary/5">$/Dead Kg</TableHead>
              <TableHead className="text-right min-w-[100px] bg-primary/5">$/Chrg Kg</TableHead>
              <TableHead className="min-w-[80px]">Currency</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[150px]">Notes</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="h-24 text-center text-muted-foreground">
                  No production costs found. Click "Add Production Cost" to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const totalCost = calculateTotalCost(row);
                const costPerDead = calculateCostPerKg(totalCost, row.total_dead_weight);
                const costPerChargeable = calculateCostPerKg(totalCost, row.total_chargeable_weight);

                return (
                  <TableRow key={row.id} className="group">
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      {row.consignment?.consignment_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.total_dead_weight.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.total_chargeable_weight.toFixed(2)}
                    </TableCell>
                    {costFields.map((field) => {
                      const isEditing = editingCell?.id === row.id && editingCell?.field === field.key;
                      const value = row[field.key as keyof ProductionCostWithConsignment] as number;

                      return (
                        <TableCell
                          key={field.key}
                          className="text-right p-0"
                        >
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              className="h-8 text-right border-0 focus-visible:ring-1"
                              autoFocus
                            />
                          ) : (
                            <button
                              className="w-full h-full px-4 py-2 text-right hover:bg-muted/50 cursor-text"
                              onClick={() => handleCellClick(row.id, field.key, value)}
                            >
                              {value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold bg-primary/5">
                      {formatCurrency(totalCost, row.currency as CurrencyType)}
                    </TableCell>
                    <TableCell className="text-right bg-primary/5">
                      {costPerDead === 'N/A' ? 'N/A' : formatCurrency(Number(costPerDead), row.currency as CurrencyType)}
                    </TableCell>
                    <TableCell className="text-right bg-primary/5">
                      {costPerChargeable === 'N/A' ? 'N/A' : formatCurrency(Number(costPerChargeable), row.currency as CurrencyType)}
                    </TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{format(new Date(row.cost_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={row.notes || ''}>
                      {row.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(row)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Cost?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the production cost record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
