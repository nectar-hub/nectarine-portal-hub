import { useState } from 'react';
import { PurchaseTracker, REGION_CURRENCIES, PURCHASE_STATUS_COLORS } from '@/types/purchase-tracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PurchaseRowEditor } from './PurchaseRowEditor';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PurchaseTrackerTableProps {
  purchases: PurchaseTracker[];
  clients: Array<{ id: string; client_name: string }>;
  onRefresh: () => void;
}

export function PurchaseTrackerTable({ purchases, clients, onRefresh }: PurchaseTrackerTableProps) {
  const [editingPurchase, setEditingPurchase] = useState<PurchaseTracker | null>(null);

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
    const { id, created_at, updated_at, created_by, updated_by, client_name, ...data } = purchase;

    const { error } = await supabase
      .from('purchase_tracker')
      .insert([
        {
          ...data,
          invoice_no: data.invoice_no || null,
          store_name: data.store_name || null,
          amount: data.amount || null,
          dop: data.dop || null,
          store_order_no: data.store_order_no || null,
          purchased_by: data.purchased_by || null,
          dod: data.dod || null,
          remarks: data.remarks || null,
          source_link: data.source_link || null,
        },
      ]);

    if (error) {
      toast.error('Failed to duplicate purchase record');
      console.error(error);
    } else {
      toast.success('Purchase record duplicated');
      onRefresh();
    }
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

  return (
    <div className="overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">CLIENT NAME</TableHead>
            <TableHead className="min-w-[130px]">INVOICE DATE</TableHead>
            <TableHead className="min-w-[120px]">INV</TableHead>
            <TableHead className="min-w-[300px]">ITEM</TableHead>
            <TableHead className="min-w-[80px]">QTY</TableHead>
            <TableHead className="min-w-[100px]">FROM</TableHead>
            <TableHead className="min-w-[150px]">STORE</TableHead>
            <TableHead className="min-w-[120px]">AMOUNT</TableHead>
            <TableHead className="min-w-[120px]">DOP</TableHead>
            <TableHead className="min-w-[180px]">STORE ORDER NO.</TableHead>
            <TableHead className="min-w-[140px]">PURCHASED BY</TableHead>
            <TableHead className="min-w-[120px]">DOD</TableHead>
            <TableHead className="min-w-[130px]">STATUS</TableHead>
            <TableHead className="min-w-[200px]">REMARKS</TableHead>
            <TableHead className="min-w-[80px]">LINK</TableHead>
            <TableHead className="min-w-[150px]">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((row) => (
            <TableRow key={row.id} className="align-top">
              <TableCell className="font-medium">{row.client_name}</TableCell>
              <TableCell>{formatDate(row.invoice_date)}</TableCell>
              <TableCell>{row.invoice_no}</TableCell>
              <TableCell>
                <div className="whitespace-pre-wrap py-1">{row.item_description}</div>
              </TableCell>
              <TableCell>{row.qty}</TableCell>
              <TableCell>{row.from_region}</TableCell>
              <TableCell>{row.store_name}</TableCell>
              <TableCell>{formatAmount(row)}</TableCell>
              <TableCell>{formatDate(row.dop)}</TableCell>
              <TableCell>{row.store_order_no}</TableCell>
              <TableCell>{row.purchased_by}</TableCell>
              <TableCell>{formatDate(row.dod)}</TableCell>
              <TableCell>
                <Badge className={`${(PURCHASE_STATUS_COLORS as any)[String(row.status)] || 'bg-muted'} text-white`}>
                  {String(row.status || 'PENDING').replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="whitespace-pre-wrap py-1">{row.remarks}</div>
              </TableCell>
              <TableCell>
                {row.source_link ? (
                  <a
                    href={row.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex"
                    title="Open source link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
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
          ))}
        </TableBody>
      </Table>

      {editingPurchase && (
        <PurchaseRowEditor
          purchase={editingPurchase}
          clients={clients}
          open={!!editingPurchase}
          onOpenChange={(open) => !open && setEditingPurchase(null)}
          onSave={() => {
            setEditingPurchase(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
