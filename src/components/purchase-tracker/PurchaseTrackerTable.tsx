import { useState } from 'react';
import { PurchaseTracker, REGION_CURRENCIES, PURCHASE_STATUS_COLORS } from '@/types/purchase-tracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PurchaseRowEditor } from './PurchaseRowEditor';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PurchaseTrackerTableProps {
  purchases: PurchaseTracker[];
  clients: Array<{ id: string; client_name: string }>;
  selectedPeriodId: string | null;
  onRefresh: () => void;
}

export function PurchaseTrackerTable({ purchases, clients, selectedPeriodId, onRefresh }: PurchaseTrackerTableProps) {
  const [editingPurchase, setEditingPurchase] = useState<PurchaseTracker | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase record?')) return;

    const { error } = await supabase
      .from('purchase_tracker')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete purchase record');
      console.error(error);
    } else {
      toast.success('Purchase record deleted');
      onRefresh();
    }
  };

  const handleDuplicate = async (purchase: PurchaseTracker) => {
    const { id, created_at, updated_at, created_by, updated_by, client_name, items, ...data } = purchase;

    // Insert the main purchase record
    const { data: newPurchase, error: purchaseError } = await supabase
      .from('purchase_tracker')
      .insert([
        {
          ...data,
          invoice_no: data.invoice_no || null,
          purchased_by: data.purchased_by || null,
          dop: data.dop || null,
          remarks: data.remarks || null,
          // Clear deprecated fields
          item_description: null,
          qty: null,
          store_name: null,
          amount: null,
          store_order_no: null,
          source_link: null,
        },
      ])
      .select()
      .single();

    if (purchaseError) {
      toast.error('Failed to duplicate purchase record');
      console.error(purchaseError);
      return;
    }

    // Duplicate items if they exist
    if (items && items.length > 0 && newPurchase) {
      const itemsToInsert = items.map(({ id, created_at, updated_at, ...item }) => ({
        ...item,
        purchase_id: newPurchase.id,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_tracker_items')
        .insert(itemsToInsert);

      if (itemsError) {
        toast.error('Failed to duplicate purchase items');
        console.error(itemsError);
        return;
      }
    }

    toast.success('Purchase record duplicated');
    onRefresh();
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '';
    try {
      return format(new Date(value), 'dd-MMM-yyyy');
    } catch {
      return value;
    }
  };

  const formatAmount = (row: PurchaseTracker) => {
    const currency = REGION_CURRENCIES[row.from_region] || { symbol: '$', code: 'USD' } as const;
    if (row.amount == null) return '';
    const amt = Number((row.amount as unknown) as number);
    if (Number.isNaN(amt)) return String(row.amount as any);
    return `${currency.symbol}${amt.toFixed(2)}`;
  };

  const hasItems = (row: PurchaseTracker) => row.items && row.items.length > 0;
  const totalAmount = (row: PurchaseTracker) => {
    if (!row.items || row.items.length === 0) return null;
    const sum = row.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const currency = REGION_CURRENCIES[row.from_region] || { symbol: '$', code: 'USD' } as const;
    return `${currency.symbol}${sum.toFixed(2)}`;
  };

  return (
    <div className="overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="min-w-[180px]">CLIENT NAME</TableHead>
            <TableHead className="min-w-[130px]">INVOICE DATE</TableHead>
            <TableHead className="min-w-[120px]">INV</TableHead>
            <TableHead className="min-w-[80px]">ITEMS</TableHead>
            <TableHead className="min-w-[100px]">FROM</TableHead>
            <TableHead className="min-w-[120px]">TOTAL AMOUNT</TableHead>
            <TableHead className="min-w-[120px]">DOP</TableHead>
            <TableHead className="min-w-[140px]">PURCHASED BY</TableHead>
            <TableHead className="min-w-[130px]">STATUSTUS</TableHead>
            <TableHead className="min-w-[130px]">STATUS</TableHead>
            <TableHead className="min-w-[200px]">REMARKS</TableHead>
            <TableHead className="min-w-[150px]">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((row) => (
            <>
              <TableRow key={row.id} className="align-top">
                <TableCell>
                  {hasItems(row) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(row.id)}
                      className="p-0 h-8 w-8"
                    >
                      {expandedRows.has(row.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="font-medium">{row.client_name}</TableCell>
                <TableCell>{formatDate(row.invoice_date)}</TableCell>
                <TableCell>{row.invoice_no}</TableCell>
                <TableCell>{hasItems(row) ? row.items!.length : 0}</TableCell>
                <TableCell>{row.from_region}</TableCell>
                <TableCell>{totalAmount(row)}</TableCell>
                <TableCell>{formatDate(row.dop)}</TableCell>
                <TableCell>{row.purchased_by}</TableCell>
                <TableCell>
                  <Badge className={`${(PURCHASE_STATUS_COLORS as any)[String(row.status)] || 'bg-muted'} text-white`}>
                    {String(row.status || 'PENDING').replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="whitespace-pre-wrap py-1">{row.remarks}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingPurchase(row)} title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(row)} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {/* Expanded row showing items */}
              {expandedRows.has(row.id) && hasItems(row) && (
                <TableRow key={`${row.id}-items`} className="bg-muted/50">
                  <TableCell colSpan={12} className="p-0">
                    <div className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                             <TableHead>ITEM DESCRIPTION</TableHead>
                             <TableHead>QTY</TableHead>
                             <TableHead>STORE</TableHead>
                             <TableHead>AMOUNT</TableHead>
                             <TableHead>STORE ORDER NO.</TableHead>
                             <TableHead>DOD</TableHead>
                             <TableHead>LINK</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {row.items!.map((item) => {
                            const currency = REGION_CURRENCIES[row.from_region] || { symbol: '$', code: 'USD' } as const;
                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="whitespace-pre-wrap">{item.item_description}</div>
                                </TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{item.store_name}</TableCell>
                                <TableCell>
                                  {item.amount != null ? `${currency.symbol}${Number(item.amount).toFixed(2)}` : ''}
                                </TableCell>
                                <TableCell>{item.store_order_no}</TableCell>
                                <TableCell>{formatDate((item as any).dod)}</TableCell>
                                <TableCell>
                                  {item.source_link ? (
                                    <a
                                      href={item.source_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline inline-flex"
                                      title="Open source link"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  ) : null}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>

      {editingPurchase && (
        <PurchaseRowEditor
          purchase={editingPurchase}
          clients={clients}
          open={!!editingPurchase}
          onOpenChange={(open) => !open && setEditingPurchase(null)}
          defaultMonthPeriodId={selectedPeriodId}
          onSave={() => {
            setEditingPurchase(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
