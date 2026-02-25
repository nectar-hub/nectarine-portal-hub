import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useBfmCart } from '@/hooks/useBfmCart';
import { useBfmOrders } from '@/hooks/useBfmOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Banknote, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BfmCheckout = () => {
  const navigate = useNavigate();
  const { items, cartTotal, cartCount } = useBfmCart();
  const { createOrder } = useBfmOrders();
  const [paymentMethod, setPaymentMethod] = useState('OFFLINE');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const subtotal = items.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0);
  const totalTax = items.reduce((s, i) => s + i.estimated_tax, 0);
  const totalShipping = items.reduce((s, i) => s + i.estimated_shipping, 0);
  const totalRegulatoryFees = items.reduce((s, i) => s + (i.estimated_regulatory_fees || 0), 0);
  const cartCurrency = items.length > 0 ? items[0].currency : 'USD';

  const handlePlaceOrder = async () => {
    const order = await createOrder.mutateAsync(items);
    setPlacedOrder(order);
    setOrderPlaced(true);
  };

  if (items.length === 0 && !orderPlaced) {
    navigate('/dashboard/cart');
    return null;
  }

  if (orderPlaced) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16 space-y-6">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-6 inline-block">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Order Placed!</h1>
          <p className="text-muted-foreground">
            Your Buy For Me order <strong>{placedOrder?.order_number || ''}</strong> has been submitted.
          </p>
          <Card>
            <CardContent className="p-6 text-left space-y-3">
              <h3 className="font-semibold">Offline Payment Instructions</h3>
              <p className="text-sm text-muted-foreground">
                Please make payment via bank transfer or mobile money. Once you've paid, click "I Have Paid" in your orders page
                or contact our team to confirm your payment.
              </p>
              <p className="text-sm text-muted-foreground">
                Your order will be processed once payment is confirmed by our admin team.
              </p>
            </CardContent>
          </Card>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard/buy-for-me')}>
              Continue Shopping
            </Button>
            <Button className="bg-nectarine-500 hover:bg-nectarine-600" onClick={() => navigate('/dashboard/bfm-orders')}>
              View My Orders
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/cart')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>{cartCount} item(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="truncate mr-4">{item.product_name} × {item.quantity}</span>
                <span className="flex-shrink-0">{cartCurrency} {((item.unit_price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator className="my-3" />
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{cartCurrency} {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Est. Tax</span><span>{cartCurrency} {totalTax.toFixed(2)}</span></div>
            {totalRegulatoryFees > 0 && (
              <div className="flex justify-between text-sm"><span>Regulatory Fees</span><span>{cartCurrency} {totalRegulatoryFees.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-sm"><span>Est. Shipping</span><span>{cartCurrency} {totalShipping.toFixed(2)}</span></div>
            <Separator className="my-3" />
            <div className="flex justify-between font-semibold text-lg"><span>Grand Total</span><span>{cartCurrency} {cartTotal.toFixed(2)}</span></div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50" onClick={() => setPaymentMethod('OFFLINE')}>
                <RadioGroupItem value="OFFLINE" id="offline" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="offline" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Banknote className="h-4 w-4" /> Offline Payment
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Pay via bank transfer or mobile money. Instructions will be provided after placing the order.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border opacity-50 cursor-not-allowed">
                <RadioGroupItem value="DPO" id="dpo" disabled className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="dpo" className="flex items-center gap-2 font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Pay Online (DPO)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Coming soon – Pay securely online with DPO.</p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-nectarine-500 hover:bg-nectarine-600"
              onClick={handlePlaceOrder}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order...</>
              ) : (
                <>Place Order · {cartCurrency} {cartTotal.toFixed(2)}</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BfmCheckout;
