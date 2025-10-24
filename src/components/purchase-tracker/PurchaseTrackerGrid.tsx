import { useState } from 'react';
import { DataGrid, type Column } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { PurchaseTracker, REGION_CURRENCIES, PURCHASE_STATUS_COLORS } from '@/types/purchase-tracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PurchaseRowEditor } from './PurchaseRowEditor';
import { format } from 'date-fns';

interface PurchaseTrackerGridProps {
  purchases: PurchaseTracker[];
  clients: Array<{ id: string; client_name: string }>;
  onRefresh: () => void;
}

export function PurchaseTrackerGrid({ purchases, clients, onRefresh }: PurchaseTrackerGridProps) {
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
      .insert([{
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
      }]);

    if (error) {
      toast.error('Failed to duplicate purchase record');
      console.error(error);
    } else {
      toast.success('Purchase record duplicated');
      onRefresh();
    }
  };

  const columns: Column<PurchaseTracker>[] = [
    {
      key: 'client_name',
      name: 'CLIENT NAME',
      width: 180,
      frozen: true,
      resizable: true,
    },
    {
      key: 'invoice_date',
      name: 'INVOICE DATE',
      width: 130,
      resizable: true,
      renderCell: ({ row }) => {
        if (!row.invoice_date) return '';
        try {
          return format(new Date(row.invoice_date), 'dd-MMM-yyyy');
        } catch {
          return row.invoice_date;
        }
      },
    },
    {
      key: 'invoice_no',
      name: 'INV',
      width: 150,
      resizable: true,
    },
    {
      key: 'item_description',
      name: 'ITEM',
      width: 300,
      resizable: true,
      renderCell: ({ row }) => (
        <div className="whitespace-pre-wrap py-1">{row.item_description}</div>
      ),
    },
    {
      key: 'qty',
      name: 'QTY',
      width: 80,
      resizable: true,
    },
    {
      key: 'from_region',
      name: 'FROM',
      width: 100,
      resizable: true,
    },
    {
      key: 'store_name',
      name: 'STORE',
      width: 150,
      resizable: true,
    },
    {
      key: 'amount',
      name: 'AMOUNT',
      width: 120,
      resizable: true,
      renderCell: ({ row }) => {
        const currency = REGION_CURRENCIES[row.from_region] || { symbol: '$', code: 'USD' };
        if (row.amount == null) return '';
        const amt = Number((row.amount as unknown) as number);
        if (Number.isNaN(amt)) return String(row.amount as any);
        return `${currency.symbol}${amt.toFixed(2)}`;
      },
    },
    {
      key: 'dop',
      name: 'DOP',
      width: 120,
      resizable: true,
      renderCell: ({ row }) => {
        if (!row.dop) return '';
        try {
          return format(new Date(row.dop), 'dd-MMM-yyyy');
        } catch {
          return row.dop;
        }
      },
    },
    {
      key: 'store_order_no',
      name: 'STORE ORDER NO.',
      width: 180,
      resizable: true,
    },
    {
      key: 'purchased_by',
      name: 'PURCHASED BY',
      width: 140,
      resizable: true,
    },
    {
      key: 'dod',
      name: 'DOD',
      width: 120,
      resizable: true,
      renderCell: ({ row }) => {
        if (!row.dod) return '';
        try {
          return format(new Date(row.dod), 'dd-MMM-yyyy');
        } catch {
          return row.dod;
        }
      },
    },
    {
      key: 'status',
      name: 'STATUS',
      width: 130,
      resizable: true,
      renderCell: ({ row }) => (
        <Badge className={`${(PURCHASE_STATUS_COLORS as any)[String(row.status)] || 'bg-muted'} text-white`}>
          {String(row.status || 'PENDING').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'remarks',
      name: 'REMARKS',
      width: 200,
      resizable: true,
      renderCell: ({ row }) => (
        <div className="whitespace-pre-wrap py-1">{row.remarks}</div>
      ),
    },
    {
      key: 'source_link',
      name: 'LINK',
      width: 80,
      resizable: true,
      renderCell: ({ row }) => 
        row.source_link ? (
          <a 
            href={row.source_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null,
    },
    {
      key: 'actions',
      name: 'ACTIONS',
      width: 150,
      frozen: true,
      renderCell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingPurchase(row)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDuplicate(row)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataGrid
        columns={columns}
        rows={purchases}
        rowKeyGetter={(row) => row.id}
        className="rdg-light"
        style={{ height: '100%' }}
        rowHeight={50}
      />

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
    </>
  );
}
