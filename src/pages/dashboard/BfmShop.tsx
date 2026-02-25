import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useBfmCart } from '@/hooks/useBfmCart';
import { AddToCartModal } from '@/components/bfm/AddToCartModal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, ShoppingCart, Link2, ArrowRight, Globe, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScrapedProduct } from '@/types/bfm';

const BfmShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem, cartCount, cartTotal } = useBfmCart();
  const [url, setUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const handleScrapeAndAdd = async (inputUrl?: string) => {
    const targetUrl = inputUrl || url;
    if (!targetUrl.trim()) {
      toast({ title: 'Enter a URL', description: 'Please paste a product link first', variant: 'destructive' });
      return;
    }

    setCurrentUrl(targetUrl);
    setScrapedData(null);
    setIsModalOpen(true);
    setIsScraping(true);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: targetUrl },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setScrapedData(data.data as ScrapedProduct);
      } else {
        // Open modal without scraped data - user fills manually
        toast({ title: 'Could not auto-detect', description: 'Please fill in the product details manually' });
      }
    } catch (err: any) {
      console.error('Scrape error:', err);
      toast({ title: 'Scraping failed', description: 'Please fill in the details manually' });
    } finally {
      setIsScraping(false);
    }
  };

  const handleAddToCart = (item: any) => {
    if (!user) return;
    addItem.mutate({ ...item, user_id: user.id });
    setUrl('');
    setScrapedData(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buy For Me</h1>
            <p className="text-muted-foreground mt-1">
              Paste a product link from any store and we'll purchase it for you
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/cart')}
            variant="outline"
            className="relative"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <Badge className="ml-2 bg-nectarine-500 text-white hover:bg-nectarine-600">{cartCount}</Badge>
            )}
          </Button>
        </div>

        {/* Main Search Card */}
        <Card className="border-2 border-nectarine-200 dark:border-nectarine-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-nectarine-500" />
              Smart Product Capture
            </CardTitle>
            <CardDescription>
              Paste a product URL from Amazon, eBay, AliExpress, Zara, or any online store. We'll automatically extract the product details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.amazon.com/product/..."
                  className="pl-10"
                  onKeyDown={e => e.key === 'Enter' && handleScrapeAndAdd()}
                />
              </div>
              <Button
                onClick={() => handleScrapeAndAdd()}
                disabled={!url.trim() || isScraping}
                className="bg-nectarine-500 hover:bg-nectarine-600 whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-nectarine-300 transition-colors" onClick={() => navigate('/dashboard/cart')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-nectarine-100 dark:bg-nectarine-900/30 rounded-full p-3">
                <ShoppingCart className="h-6 w-6 text-nectarine-600" />
              </div>
              <div>
                <p className="font-semibold">My Cart</p>
                <p className="text-sm text-muted-foreground">
                  {cartCount} items · ${cartTotal.toFixed(2)}
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-nectarine-300 transition-colors" onClick={() => navigate('/dashboard/bfm-orders')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">My Orders</p>
                <p className="text-sm text-muted-foreground">View order history</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-nectarine-300 transition-colors" onClick={() => {
            setUrl('');
            const input = document.querySelector<HTMLInputElement>('input[placeholder*="amazon"]');
            input?.focus();
          }}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <Link2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Paste Link</p>
                <p className="text-sm text-muted-foreground">Quick add a product</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Supported Stores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Stores</CardTitle>
            <CardDescription>You can add products from any online store. Here are some popular ones:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Amazon', 'eBay', 'AliExpress', 'Walmart', 'Zara', 'ASOS', 'Nike', 'Shein', 'H&M', 'Target', 'Best Buy', 'Etsy'].map(store => (
                <Badge key={store} variant="secondary" className="text-sm py-1 px-3">{store}</Badge>
              ))}
              <Badge variant="outline" className="text-sm py-1 px-3">+ Any store</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddToCartModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        scrapedData={scrapedData}
        productUrl={currentUrl}
        isLoading={isScraping}
        onAddToCart={handleAddToCart}
      />
    </DashboardLayout>
  );
};

export default BfmShop;
