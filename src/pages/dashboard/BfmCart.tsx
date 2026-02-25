import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useBfmCart } from '@/hooks/useBfmCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const BfmCart = () => {
  const navigate = useNavigate();
  const { items, isLoading, cartTotal, cartCount, updateItem, removeItem, clearCart } = useBfmCart();

  const subtotal = items.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0);
  const totalTax = items.reduce((s, i) => s + i.estimated_tax, 0);
  const totalShipping = items.reduce((s, i) => s + i.estimated_shipping, 0);

  const handleQtyChange = (id: string, newQty: number) => {
    if (newQty < 1) return;
    updateItem.mutate({ id, quantity: newQty });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nectarine Cart</h1>
            <p className="text-muted-foreground mt-1">{cartCount} item(s) in your cart</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/buy-for-me')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
            </Button>
            {items.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => {
                clearCart.mutate();
                toast({ title: 'Cart Cleared' });
              }}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-muted-foreground mt-1">Start by pasting a product link</p>
              <Button className="mt-4 bg-nectarine-500 hover:bg-nectarine-600" onClick={() => navigate('/dashboard/buy-for-me')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => {
                const lineTotal = (item.unit_price || 0) * item.quantity + item.estimated_tax + item.estimated_shipping;
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {item.product_image_url && (
                          <img
                            src={item.product_image_url}
                            alt={item.product_name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium truncate">{item.product_name}</h4>
                              {item.store_name && (
                                <p className="text-sm text-muted-foreground">{item.store_name}</p>
                              )}
                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                {item.variant_color && <span>Color: {item.variant_color}</span>}
                                {item.variant_size && <span>Size: {item.variant_size}</span>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeItem.mutate(item.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleQtyChange(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleQtyChange(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{item.currency} {lineTotal.toFixed(2)}</p>
                              {item.unit_price && <p className="text-xs text-muted-foreground">{item.currency} {item.unit_price.toFixed(2)} each</p>}
                            </div>
                          </div>
                          {item.product_url && (
                            <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="text-xs text-nectarine-500 hover:underline flex items-center gap-1 mt-2">
                              <ExternalLink className="h-3 w-3" /> View product
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Est. Tax</span>
                    <span>${totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Est. Shipping</span>
                    <span>${totalShipping.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-nectarine-500 hover:bg-nectarine-600"
                    onClick={() => navigate('/dashboard/checkout')}
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BfmCart;
