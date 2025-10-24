import { useState } from 'react';
import { DataGrid } from 'react-data-grid';
import type { Column } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { PurchaseTracker, PURCHASE_STATUS_COLORS, REGION_CURRENCIES } from '@/types/purchase-tracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import PurchaseRowEditor from './PurchaseRowEditor';
import { toNumber } from '@/utils/number';

interface PurchaseTrackerGridProps {
  purchases: PurchaseTracker[];
  isLoading: boolean;
  onRefresh: () => void;
}

const PurchaseTrackerGrid = ({
  purchases,
  isLoading,
  onRefresh,
}: PurchaseTrackerGridProps) => {
  const [selectedRow, setSelectedRow] = useState<PurchaseTracker | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleCellEdit = async (
    purchaseId: string,
    field: keyof PurchaseTracker,
    value: any
  ) => {
    try {
      const { error } = await supabase
        .from('purchase_tracker')
        .update({ [field]: value })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: 'Updated',
        description: 'Record updated successfully',
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (purchase: PurchaseTracker) => {
    try {
      const { id, created_at, updated_at, created_by, updated_by, client_name, ...data } = purchase;
      const { error } = await supabase
        .from('purchase_tracker')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Duplicated',
        description: 'Row duplicated successfully',
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase
        .from('purchase_tracker')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Record deleted successfully',
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const columns: Column<PurchaseTracker>[] = [
    {
      key: 'client_name',
      name: 'Client Name',
      frozen: true,
      width: 180,
      resizable: true,
    },
    {
      key: 'invoice_date',
      name: 'Invoice Date',
      width: 120,
      resizable: true,
    },
    {
      key: 'invoice_no',
      name: 'INV',
      width: 120,
      resizable: true,
    },
    {
      key: 'item_description',
      name: 'ITEM',
      width: 300,
      resizable: true,
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
      width: 80,
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
        const currency = REGION_CURRENCIES[row.from_region as keyof typeof REGION_CURRENCIES];
        const symbol = currency?.symbol ?? '';
        return (
          <span>
            {symbol}
            {Number(row.amount ?? 0).toFixed(2)}
          </span>
        );
      },
    },
    {
      key: 'dop',
      name: 'DOP',
      width: 120,
      resizable: true,
    },
    {
      key: 'store_order_no',
      name: 'STORE ORDER NO.',
      width: 150,
      resizable: true,
    },
    {
      key: 'purchased_by',
      name: 'PURCHASED BY',
      width: 150,
      resizable: true,
    },
    {
      key: 'dod',
      name: 'DOD',
      width: 120,
      resizable: true,
    },
    {
      key: 'status',
      name: 'STATUS',
      width: 130,
      resizable: true,
      renderCell: ({ row }) => (
        <Badge className={`${PURCHASE_STATUS_COLORS[row.status as keyof typeof PURCHASE_STATUS_COLORS] ?? ''} text-white`}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'remarks',
      name: 'REMARKS',
      width: 200,
      resizable: true,
    },
    {
      key: 'source_link',
      name: 'LINK',
      width: 100,
      resizable: true,
      renderCell: ({ row }) =>
        row.source_link ? (
          <a
            href={row.source_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null,
    },
    {
      key: 'actions',
      name: 'Actions',
      width: 150,
      frozen: true,
      renderCell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedRow(row);
              setShowEditor(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDuplicate(row)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const handleAddRow = () => {
    setSelectedRow(null);
    setShowEditor(true);
  };

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <Button onClick={handleAddRow}>
          Add Purchase
        </Button>
      </div>

      <div style={{ height: '600px' }}>
        <DataGrid
          columns={columns}
          rows={purchases}
          rowKeyGetter={(row) => row.id}
          className="rdg-light"
          style={{ height: '100%' }}
        />
      </div>

      {showEditor && (
        <PurchaseRowEditor
          purchase={selectedRow}
          onClose={() => {
            setShowEditor(false);
            setSelectedRow(null);
          }}
          onSave={() => {
            setShowEditor(false);
            setSelectedRow(null);
            onRefresh();
          }}
        />
      )}
    </Card>
  );
};

export default PurchaseTrackerGrid;
