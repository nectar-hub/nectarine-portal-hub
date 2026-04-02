import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { RealTimeEntryForm } from './RealTimeEntryForm';
import { RealTimeSearchBar, type TransactionFilters } from './RealTimeSearchBar';
import type { RealTimeDay, RealTimeEntryRow, PaymentAccount } from '@/types/real-time';
import { cn } from '@/lib/utils';

interface RealTimeGridProps {
  day: RealTimeDay | null;
  entries: RealTimeEntryRow[];
  openingTotal: number;
  onAddEntry: (entry: {
    item: string;
    description: string;
    payment_account: PaymentAccount;
    amount: number;
    reference_no?: string;
  }) => void;
  onUpdateEntry: (data: { id: string } & Partial<RealTimeEntryRow>) => void;
  onDeleteEntry: (id: string) => void;
}

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

const formatCurrency = (val: number | null): string => {
  if (val === null) return '';
  return safeNum(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const RealTimeGrid = ({
  day,
  entries,
  openingTotal,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: RealTimeGridProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RealTimeEntryRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    searchQuery: '',
    paymentAccount: 'all',
    amountFilter: 'all',
    sortField: 'default',
  });

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Text search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.item.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.reference_no && e.reference_no.toLowerCase().includes(q))
      );
    }

    // Payment account filter
    if (filters.paymentAccount !== 'all') {
      result = result.filter((e) => e.payment_account === filters.paymentAccount);
    }

    // Amount type filter
    if (filters.amountFilter === 'inflows') {
      result = result.filter((e) => safeNum(e.amount) > 0);
    } else if (filters.amountFilter === 'outflows') {
      result = result.filter((e) => safeNum(e.amount) < 0);
    }

    // Sorting
    switch (filters.sortField) {
      case 'amount_desc':
        result.sort((a, b) => Math.abs(safeNum(b.amount)) - Math.abs(safeNum(a.amount)));
        break;
      case 'amount_asc':
        result.sort((a, b) => Math.abs(safeNum(a.amount)) - Math.abs(safeNum(b.amount)));
        break;
      case 'item_asc':
        result.sort((a, b) => a.item.localeCompare(b.item));
        break;
      case 'item_desc':
        result.sort((a, b) => b.item.localeCompare(a.item));
        break;
    }

    return result;
  }, [entries, filters]);

  if (!day) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No day selected. Create or select a day first.</p>
      </div>
    );
  }

  const handleEdit = (entry: RealTimeEntryRow) => {
    setEditingEntry(entry);
  };

  const handleEditSubmit = (data: {
    item: string;
    description: string;
    payment_account: PaymentAccount;
    amount: number;
    reference_no?: string;
  }) => {
    if (editingEntry) {
      onUpdateEntry({ id: editingEntry.id, ...data });
      setEditingEntry(null);
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Transactions</h3>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
        <RealTimeSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={filteredEntries.length}
          totalCount={entries.length}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold min-w-[150px] sticky left-0 bg-muted/50">ITEM</TableHead>
              <TableHead className="font-bold min-w-[250px]">DESCRIPTION</TableHead>
              <TableHead className="font-bold text-right min-w-[120px]">CASH</TableHead>
              <TableHead className="font-bold text-right min-w-[120px]">NMB CARD</TableHead>
              <TableHead className="font-bold text-right min-w-[120px]">MPESA (271)</TableHead>
              <TableHead className="font-bold text-right min-w-[140px]">CRDB</TableHead>
              <TableHead className="font-bold text-right min-w-[120px]">CRDB USD</TableHead>
              <TableHead className="font-bold text-right min-w-[140px]">TOTAL</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Opening Balance Row - Read Only */}
            <TableRow className="bg-primary/5 font-semibold">
              <TableCell className="sticky left-0 bg-primary/5">BALANCE B/D</TableCell>
              <TableCell>OPENING BALANCE</TableCell>
              <TableCell className="text-right">{formatCurrency(safeNum(day.opening_cash))}</TableCell>
              <TableCell className="text-right">{formatCurrency(safeNum(day.opening_nmb_card))}</TableCell>
              <TableCell className="text-right">{formatCurrency(safeNum(day.opening_mpesa_271))}</TableCell>
              <TableCell className="text-right">{formatCurrency(safeNum(day.opening_crdb))}</TableCell>
              <TableCell className="text-right">{formatCurrency(safeNum(day.opening_crdb_usd))}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(openingTotal)}</TableCell>
              <TableCell></TableCell>
            </TableRow>

            {/* Entry Rows */}
            {filteredEntries.map((entry) => (
              <TableRow 
                key={entry.id}
                className={cn(
                  'group hover:bg-muted/50',
                  safeNum(entry.amount) < 0 && 'text-destructive'
                )}
              >
                <TableCell className="sticky left-0 bg-background group-hover:bg-muted/50 font-medium">
                  {entry.item}
                </TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell className="text-right">
                  {entry.cash_col !== null ? formatCurrency(entry.cash_col) : ''}
                </TableCell>
                <TableCell className="text-right">
                  {entry.nmb_card_col !== null ? formatCurrency(entry.nmb_card_col) : ''}
                </TableCell>
                <TableCell className="text-right">
                  {entry.mpesa_271_col !== null ? formatCurrency(entry.mpesa_271_col) : ''}
                </TableCell>
                <TableCell className="text-right">
                  {entry.crdb_col !== null ? formatCurrency(entry.crdb_col) : ''}
                </TableCell>
                <TableCell className="text-right">
                  {entry.crdb_usd_col !== null ? formatCurrency(entry.crdb_usd_col) : ''}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(entry.running_total)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No entries yet. Click "Add Entry" to add a transaction.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Entry Form */}
      <RealTimeEntryForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={onAddEntry}
        mode="add"
      />

      {/* Edit Entry Form */}
      {editingEntry && (
        <RealTimeEntryForm
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          onSubmit={handleEditSubmit}
          initialData={{
            item: editingEntry.item,
            description: editingEntry.description,
            payment_account: editingEntry.payment_account,
            amount: safeNum(editingEntry.amount),
            reference_no: editingEntry.reference_no || undefined,
          }}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDeleteEntry(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
