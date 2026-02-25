import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingCart } from 'lucide-react';
import type { ScrapedProduct } from '@/types/bfm';

interface AddToCartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scrapedData: ScrapedProduct | null;
  productUrl: string;
  isLoading: boolean;
  onAddToCart: (item: {
    product_url: string;
    product_name: string;
    product_image_url: string | null;
    store_name: string | null;
    variant_color: string | null;
    variant_size: string | null;
    quantity: number;
    unit_price: number | null;
    currency: string;
    estimated_tax: number;
    estimated_shipping: number;
    notes: string | null;
  }) => void;
}

export const AddToCartModal = ({ open, onOpenChange, scrapedData, productUrl, isLoading, onAddToCart }: AddToCartModalProps) => {
  const [productName, setProductName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [tax, setTax] = useState('0');
  const [shipping, setShipping] = useState('0');
  const [notes, setNotes] = useState('');

  // Tax rates by currency/region
  const TAX_RATES: Record<string, { rate: number; label: string }> = {
    USD: { rate: 0.0775, label: 'CA Sales Tax + Regulatory Fees 7.75%' },
    GBP: { rate: 0.20, label: 'UK VAT 20%' },
    EUR: { rate: 0.21, label: 'EU VAT 21%' },
  };

  const taxInfo = TAX_RATES[currency];

  // Auto-calculate tax when price/quantity/currency changes
  useEffect(() => {
    if (taxInfo && unitPrice) {
      const price = parseFloat(unitPrice) || 0;
      const calculatedTax = Math.round(price * quantity * taxInfo.rate * 100) / 100;
      setTax(calculatedTax.toString());
    }
  }, [unitPrice, quantity, currency]);

  useEffect(() => {
    if (scrapedData) {
      setProductName(scrapedData.product_name || '');
      setStoreName(scrapedData.store_name || '');
      setImageUrl(scrapedData.image_url || '');
      setUnitPrice(scrapedData.price?.toString() || '');
      setCurrency(scrapedData.currency || 'USD');
    } else {
      // Try to extract store from URL
      try {
        const domain = new URL(productUrl).hostname.replace('www.', '');
        setStoreName(domain);
      } catch { setStoreName(''); }
    }
  }, [scrapedData, productUrl]);

  const handleSubmit = () => {
    onAddToCart({
      product_url: productUrl,
      product_name: productName,
      product_image_url: imageUrl || null,
      store_name: storeName || null,
      variant_color: color || null,
      variant_size: size || null,
      quantity,
      unit_price: unitPrice ? parseFloat(unitPrice) : null,
      currency,
      estimated_tax: parseFloat(tax) || 0,
      estimated_shipping: parseFloat(shipping) || 0,
      notes: notes || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-nectarine-500" />
            Add to Nectarine Cart
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-nectarine-500" />
            <p className="text-sm text-muted-foreground">Extracting product details...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {imageUrl && (
              <div className="flex justify-center">
                <img src={imageUrl} alt={productName} className="max-h-40 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product name" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. Amazon" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'GBP', 'EUR', 'AED', 'CNY', 'AUD', 'TZS'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Color</Label>
                {scrapedData?.available_colors?.length ? (
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>
                      {scrapedData.available_colors.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Black" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                {scrapedData?.available_sizes?.length ? (
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      {scrapedData.available_sizes.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. M" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label>Unit Price</Label>
                <Input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Est. Tax {taxInfo && <span className="text-xs text-muted-foreground">({taxInfo.label})</span>}</Label>
                <Input type="number" step="0.01" value={tax} onChange={e => setTax(e.target.value)} placeholder="0.00" />
                {taxInfo && <p className="text-xs text-muted-foreground">Auto-calculated: {taxInfo.label}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Est. Shipping</Label>
              <Input type="number" step="0.01" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !productName} className="bg-nectarine-500 hover:bg-nectarine-600">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
