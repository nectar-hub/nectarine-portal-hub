import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
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
} from '@/types/production-cost';
import { format, parseISO, isWithinInterval, isBefore, isAfter, isEqual } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExchangeRates } from '@/hooks/useExchangeRates';

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
  
  const { exchangeRates } = useExchangeRates();

  // Build a rate lookup function from cached exchange rates
  const getRateFromCache = useCallback((baseCurrency: string, quoteCurrency: string, costDate: string): number | null => {
    if (!exchangeRates || exchangeRates.length === 0) return null;
    if (baseCurrency === quoteCurrency) return 1;
    
    const date = parseISO(costDate);
    
    // Filter and sort rates by effective_from descending to get the most recent applicable rate
    const findRate = (base: string, quote: string) => {
      return exchangeRates
        .filter(r => 
          r.base_currency === base && 
          r.quote_currency === quote &&
          r.is_active
        )
        .sort((a, b) => parseISO(b.effective_from).getTime() - parseISO(a.effective_from).getTime())
        .find(r => {
          const effectiveFrom = parseISO(r.effective_from);
          const effectiveTo = r.effective_to ? parseISO(r.effective_to) : null;
          // Rate is valid if: effective_from <= cost_date AND (no end date OR cost_date <= effective_to)
          return !isAfter(effectiveFrom, date) && (!effectiveTo || !isAfter(date, effectiveTo));
        });
    };
    
    // Try direct rate (e.g., TZS -> USD)
    const directRate = findRate(baseCurrency, quoteCurrency);
    if (directRate) return directRate.rate;
    
    // Try inverse rate (e.g., USD -> TZS, then invert for TZS -> USD)
    const inverseRate = findRate(quoteCurrency, baseCurrency);
    if (inverseRate) return 1 / inverseRate.rate;
    
    return null;
  }, [exchangeRates]);

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

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[180px]">Consignment</TableHead>
              
              <TableHead className="text-right min-w-[80px]">Dead Wt</TableHead>
              <TableHead className="text-right min-w-[80px]">Vol Wt</TableHead>
              <TableHead className="text-right min-w-[80px]">Chrg Wt</TableHead>
              {/* Foreign currency columns */}
              {foreignCostFields.map((field) => (
                <TableHead key={field.key} className="text-right min-w-[90px] bg-blue-50 dark:bg-blue-950/30">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[100px] bg-blue-100 dark:bg-blue-900/50 font-semibold">Foreign Total</TableHead>
              {/* TZS columns */}
              {localCostFields.map((field) => (
                <TableHead key={field.key} className="text-right min-w-[80px] bg-green-50 dark:bg-green-950/30">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[140px] bg-green-100 dark:bg-green-900/50 font-semibold">Local Total</TableHead>
              <TableHead className="text-right min-w-[90px] bg-purple-50 dark:bg-purple-950/30">Revenue</TableHead>
              <TableHead className="text-right min-w-[100px] bg-purple-100 dark:bg-purple-900/50">Profit</TableHead>
              <TableHead className="text-right min-w-[70px]">Margin</TableHead>
              <TableHead className="min-w-[50px]">Curr</TableHead>
              <TableHead className="min-w-[80px]">Date</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={21} className="h-24 text-center text-muted-foreground">
                  No production costs found. Click "Add Production Cost" to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const foreignTotal = calculateForeignCosts(row);
                const localTotal = calculateLocalCosts(row);
                const revenue = Number(row.revenue_total) || 0;
                
                // Get TZS to foreign currency rate from cached exchange rates
                const tzsToForeignRate = getRateFromCache('TZS', row.currency, row.cost_date);
                
                // Convert local costs to foreign currency
                const localTotalConverted = tzsToForeignRate ? localTotal * tzsToForeignRate : null;
                
                // Calculate accurate profit: Revenue - (Foreign Costs + Converted Local Costs)
                const totalCosts = localTotalConverted !== null 
                  ? foreignTotal + localTotalConverted 
                  : foreignTotal;
                const profit = revenue - totalCosts;
                
                // Calculate profit margin
                const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + '%' : 'N/A';

                return (
                  <TableRow key={row.id} className="group">
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      {row.consignment?.consignment_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {(Number(row.total_dead_weight) || 0).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {(Number(row.total_volumetric_weight) || 0).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {(Number(row.total_chargeable_weight) || 0).toFixed(1)}
                    </TableCell>
                    {/* Foreign currency fields */}
                    {foreignCostFields.map((field) => {
                      const isEditing = editingCell?.id === row.id && editingCell?.field === field.key;
                      const value = Number(row[field.key as keyof ProductionCostWithConsignment]) || 0;

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
                              className="w-full h-full px-2 py-2 text-right hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-text text-sm"
                              onClick={() => handleCellClick(row.id, field.key, value)}
                            >
                              {value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm">
                      {formatForeignCurrency(foreignTotal, row.currency)}
                    </TableCell>
                    {/* Local TZS fields */}
                    {localCostFields.map((field) => {
                      const isEditing = editingCell?.id === row.id && editingCell?.field === field.key;
                      const value = Number(row[field.key as keyof ProductionCostWithConsignment]) || 0;

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
                    <TableCell className="text-right font-semibold bg-green-100/70 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm">
                      <div className="flex flex-col items-end">
                        <span>{formatTZS(localTotal)}</span>
                        {localTotalConverted !== null ? (
                          <span className="text-xs text-muted-foreground">
                            ≈ {formatForeignCurrency(localTotalConverted, row.currency)}
                          </span>
                        ) : (
                          <span className="text-xs text-orange-500">No rate</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Revenue */}
                    <TableCell className="text-right p-0 bg-purple-50/50 dark:bg-purple-950/20">
                      {editingCell?.id === row.id && editingCell?.field === 'revenue_total' ? (
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
                          className="w-full h-full px-2 py-2 text-right hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-text text-sm font-medium"
                          onClick={() => handleCellClick(row.id, 'revenue_total', revenue)}
                        >
                          {formatForeignCurrency(revenue, row.currency)}
                        </button>
                      )}
                    </TableCell>
                    {/* Profit */}
                    <TableCell className={cn(
                      'text-right font-semibold bg-purple-100/70 dark:bg-purple-900/40 text-sm',
                      profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      <div className="flex flex-col items-end">
                        <span className="flex items-center justify-end gap-1">
                          {profit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatForeignCurrency(Math.abs(profit), row.currency)}
                        </span>
                        {tzsToForeignRate !== null ? (
                          <span className="text-xs text-muted-foreground">
                            ≈ {formatTZS(Math.abs(profit) / tzsToForeignRate)}
                          </span>
                        ) : (
                          <span className="text-xs text-orange-500">No rate</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Margin */}
                    <TableCell className={cn(
                      'text-right text-sm font-medium',
                      profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {profitMargin}
                    </TableCell>
                    <TableCell className="text-sm">{row.currency}</TableCell>
                    <TableCell className="text-sm">{format(new Date(row.cost_date), 'MMM d, yy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(row)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
