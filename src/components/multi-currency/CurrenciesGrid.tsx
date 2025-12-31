import { useState } from 'react';
import { Currency } from '@/types/currency';
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
import { Edit2, Trash2, Star } from 'lucide-react';

interface CurrenciesGridProps {
  currencies: Currency[];
  onEdit: (currency: Currency) => void;
  onDelete: (code: string) => void;
  onToggleActive: (code: string, isActive: boolean) => void;
  onSetBase: (code: string) => void;
}

export function CurrenciesGrid({
  currencies,
  onEdit,
  onDelete,
  onToggleActive,
  onSetBase,
}: CurrenciesGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [baseConfirm, setBaseConfirm] = useState<string | null>(null);

  const handleDelete = (code: string) => {
    onDelete(code);
    setDeleteConfirm(null);
  };

  const handleSetBase = (code: string) => {
    onSetBase(code);
    setBaseConfirm(null);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[80px]">Symbol</TableHead>
              <TableHead className="w-[100px]">Decimals</TableHead>
              <TableHead className="w-[100px]">Active</TableHead>
              <TableHead className="w-[100px]">Base</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No currencies configured
                </TableCell>
              </TableRow>
            ) : (
              currencies.map((currency) => (
                <TableRow key={currency.code}>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>{currency.decimal_places}</TableCell>
                  <TableCell>
                    <Switch
                      checked={currency.is_active}
                      onCheckedChange={(checked) => onToggleActive(currency.code, checked)}
                      disabled={currency.is_base}
                    />
                  </TableCell>
                  <TableCell>
                    {currency.is_base ? (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Base
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBaseConfirm(currency.code)}
                        disabled={!currency.is_active}
                      >
                        Set as Base
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(currency)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(currency.code)}
                        disabled={currency.is_base}
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
            <AlertDialogTitle>Delete Currency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this currency? This action cannot be undone.
              If this currency is used in any records, the deletion will fail.
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

      <AlertDialog open={!!baseConfirm} onOpenChange={() => setBaseConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Base Currency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set {baseConfirm} as the base currency?
              This will affect all currency conversions across the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => baseConfirm && handleSetBase(baseConfirm)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
