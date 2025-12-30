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
  calculateForeignCosts,
  calculateLocalCosts,
  formatForeignCurrency,
  formatTZS,
  FOREIGN_CURRENCY_FIELDS,
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

  // Foreign currency fields
  const foreignCostFields = [
    { key: 'airline_freight_cost', label: 'Airline Freight' },
    { key: 'office_handling_cost', label: 'Office Handling' },
  ];

  // Local TZS fields
  const localCostFields = [
    { key: 'arrival_clearance_cost', label: 'Arrival Clear.' },
    { key: 'znz_airport_to_ferry_transport_cost', label: 'ZNZ→Ferry' },
    { key: 'znz_to_dar_shipping_cost', label: 'ZNZ→Dar' },
    { key: 'dar_clearance_cost', label: 'Dar Clear.' },
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

  const isForeignField = (field: string) => FOREIGN_CURRENCY_FIELDS.includes(field);

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[180px]">Consignment</TableHead>
              <TableHead className="text-right min-w-[90px]">Dead Wt</TableHead>
              <TableHead className="text-right min-w-[90px]">Vol Wt</TableHead>
              <TableHead className="text-right min-w-[90px]">Chrg Wt</TableHead>
              {/* Foreign currency columns */}
              {foreignCostFields.map((field) => (
                <TableHead key={field.key} className="text-right min-w-[100px] bg-blue-50 dark:bg-blue-950/30">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[100px] bg-blue-100 dark:bg-blue-900/50 font-semibold">Foreign Total</TableHead>
              {/* TZS columns */}
              {localCostFields.map((field) => (
                <TableHead key={field.key} className="text-right min-w-[90px] bg-green-50 dark:bg-green-950/30">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[110px] bg-green-100 dark:bg-green-900/50 font-semibold">Local Total (TZS)</TableHead>
              <TableHead className="min-w-[60px]">Curr</TableHead>
              <TableHead className="min-w-[90px]">Date</TableHead>
              <TableHead className="min-w-[120px]">Notes</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18} className="h-24 text-center text-muted-foreground">
                  No production costs found. Click "Add Production Cost" to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const foreignTotal = calculateForeignCosts(row);
                const localTotal = calculateLocalCosts(row);

                return (
                  <TableRow key={row.id} className="group">
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      {row.consignment?.consignment_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {row.total_dead_weight.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {row.total_volumetric_weight.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {row.total_chargeable_weight.toFixed(1)}
                    </TableCell>
                    {/* Foreign currency fields */}
                    {foreignCostFields.map((field) => {
                      const isEditing = editingCell?.id === row.id && editingCell?.field === field.key;
                      const value = row[field.key as keyof ProductionCostWithConsignment] as number;

                      return (
                        <TableCell key={field.key} className="text-right p-0 bg-blue-50/50 dark:bg-blue-950/20">
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
                              className="w-full h-full px-3 py-2 text-right hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-text text-sm"
                              onClick={() => handleCellClick(row.id, field.key, value)}
                            >
                              {value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {formatForeignCurrency(foreignTotal, row.currency)}
                    </TableCell>
                    {/* Local TZS fields */}
                    {localCostFields.map((field) => {
                      const isEditing = editingCell?.id === row.id && editingCell?.field === field.key;
                      const value = row[field.key as keyof ProductionCostWithConsignment] as number;

                      return (
                        <TableCell key={field.key} className="text-right p-0 bg-green-50/50 dark:bg-green-950/20">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              className="h-8 text-right border-0 focus-visible:ring-1"
                              autoFocus
                            />
                          ) : (
                            <button
                              className="w-full h-full px-2 py-2 text-right hover:bg-green-100 dark:hover:bg-green-900/30 cursor-text text-sm"
                              onClick={() => handleCellClick(row.id, field.key, value)}
                            >
                              {value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold bg-green-100/70 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                      {formatTZS(localTotal)}
                    </TableCell>
                    <TableCell className="text-sm">{row.currency}</TableCell>
                    <TableCell className="text-sm">{format(new Date(row.cost_date), 'MMM d, yy')}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-sm" title={row.notes || ''}>
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
