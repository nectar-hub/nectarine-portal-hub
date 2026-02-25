import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useBfmOrders } from '@/hooks/useBfmOrders';
import { OrderStatusTimeline } from '@/components/bfm/OrderStatusTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Eye, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { BfmOrder, BfmOrderStatus } from '@/types/bfm';

const statusOptions: BfmOrderStatus[] = [
  'SUBMITTED', 'AWAITING_PAYMENT', 'PAID', 'PURCHASED', 'IN_TRANSIT', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED',
];

const paymentStatusColor: Record<string, string> = {
  UNPAID: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

const BfmAdmin = () => {
  const { orders, isLoading, updateOrderStatus, confirmPayment } = useBfmOrders(true);
  const [selectedOrder, setSelectedOrder] = useState<BfmOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BfmOrderStatus | ''>('');
  const [adminNotes, setAdminNotes] = useState('');

  const handleViewDetails = (order: BfmOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || '');
    setDetailsOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;
    updateOrderStatus.mutate({
      orderId: selectedOrder.id,
      status: newStatus as BfmOrderStatus,
      adminNotes: adminNotes || undefined,
    });
    setDetailsOpen(false);
  };

  const handleConfirmPayment = (orderId: string) => {
    confirmPayment.mutate(orderId);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nectarine-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Buy For Me Orders</h1>
          <p className="text-muted-foreground mt-1">Manage all customer purchase requests</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders yet</TableCell>
                    </TableRow>
                  ) : (
                    orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{order.user_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{order.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.currency} {order.grand_total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColor[order.payment_status] || 'bg-muted'}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleViewDetails(order)} title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.payment_status === 'UNPAID' && (
                              <Button size="icon" variant="ghost" onClick={() => handleConfirmPayment(order.id)} title="Confirm payment" className="text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order: {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client:</span> {selectedOrder.user_name || selectedOrder.user_email}</div>
                <div><span className="text-muted-foreground">Date:</span> {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}</div>
                <div><span className="text-muted-foreground">Total:</span> {selectedOrder.currency} {selectedOrder.grand_total.toFixed(2)}</div>
                <div><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method} - {selectedOrder.payment_status}</div>
              </div>

              <OrderStatusTimeline status={selectedOrder.status} />

              <div className="space-y-2">
                <h4 className="font-semibold">Items</h4>
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    {item.product_image_url && (
                      <img src={item.product_image_url} alt="" className="w-12 h-12 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {item.store_name && <span>{item.store_name}</span>}
                        <span>Qty: {item.quantity}</span>
                        <span>{item.currency} {item.line_total.toFixed(2)}</span>
                      </div>
                      {item.product_url && (
                        <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="text-xs text-nectarine-500 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Product link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Update Status</h4>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as BfmOrderStatus)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Admin Notes
                </h4>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes..." rows={3} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} className="bg-nectarine-500 hover:bg-nectarine-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BfmAdmin;
