import DashboardLayout from '@/layouts/DashboardLayout';
import { useBfmOrders } from '@/hooks/useBfmOrders';
import { OrderStatusTimeline } from '@/components/bfm/OrderStatusTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Package, ExternalLink, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { BfmPaymentStatus } from '@/types/bfm';

const paymentStatusColor: Record<string, string> = {
  UNPAID: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

const BfmOrdersPage = () => {
  const navigate = useNavigate();
  const { orders, isLoading } = useBfmOrders();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Buy For Me Orders</h1>
            <p className="text-muted-foreground mt-1">Track your purchase requests</p>
          </div>
          <Button onClick={() => navigate('/dashboard/buy-for-me')} className="bg-nectarine-500 hover:bg-nectarine-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> New Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No orders yet</h3>
              <p className="text-muted-foreground mt-1">Start by adding products to your cart</p>
              <Button className="mt-4 bg-nectarine-500 hover:bg-nectarine-600" onClick={() => navigate('/dashboard/buy-for-me')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={paymentStatusColor[order.payment_status] || 'bg-muted'}>
                        {order.payment_status}
                      </Badge>
                      <Badge variant="outline">{order.payment_method}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')} · {order.currency} {order.grand_total.toFixed(2)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <OrderStatusTimeline status={order.status} />

                  <Accordion type="single" collapsible>
                    <AccordionItem value="items" className="border-none">
                      <AccordionTrigger className="text-sm py-2">
                        View Items ({order.items?.length || 0})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {order.items?.map(item => (
                            <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                              {item.product_image_url && (
                                <img src={item.product_image_url} alt="" className="w-12 h-12 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.product_name}</p>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  {item.store_name && <span>{item.store_name}</span>}
                                  <span>Qty: {item.quantity}</span>
                                  <span>{item.currency} {item.line_total.toFixed(2)}</span>
                                </div>
                                {item.product_url && (
                                  <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="text-xs text-nectarine-500 hover:underline flex items-center gap-1 mt-1">
                                    <ExternalLink className="h-3 w-3" /> Product link
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {order.admin_notes && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Admin Note</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{order.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BfmOrdersPage;
