import { useState } from 'react';
import { ExchangeRate } from '@/types/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatRate } from '@/lib/currency-utils';

interface ExchangeRatesGridProps {
  rates: ExchangeRate[];
  onEdit: (rate: ExchangeRate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function ExchangeRatesGrid({
  rates,
  onEdit,
  onDelete,
  onToggleActive,
}: ExchangeRatesGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const isRateActive = (rate: ExchangeRate): boolean => {
    if (!rate.is_active) return false;
    const today = new Date();
    const effectiveFrom = new Date(rate.effective_from);
    if (effectiveFrom > today) return false;
    if (rate.effective_to) {
      const effectiveTo = new Date(rate.effective_to);
      if (effectiveTo < today) return false;
    }
    return true;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Base</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Effective To</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Active</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No exchange rates configured
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.base_currency}</TableCell>
                  <TableCell>{rate.quote_currency}</TableCell>
                  <TableCell className="text-right font-mono">{formatRate(rate.rate)}</TableCell>
                  <TableCell>{format(new Date(rate.effective_from), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {rate.effective_to
                      ? format(new Date(rate.effective_to), 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rate.source || 'manual'}</Badge>
                  </TableCell>
                  <TableCell>
                    {isRateActive(rate) ? (
                      <Badge variant="default">Current</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rate.is_active}
                      onCheckedChange={(checked) => onToggleActive(rate.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(rate)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exchange Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exchange rate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
