import { useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useBfmCart } from '@/hooks/useBfmCart';
import { AddToCartModal } from '@/components/bfm/AddToCartModal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart, ArrowLeft, ArrowRight, RotateCcw, Globe,
  Plus, ExternalLink, Loader2, AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScrapedProduct } from '@/types/bfm';

const BfmShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem, cartCount } = useBfmCart();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Browser state
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Cart modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [captureUrl, setCaptureUrl] = useState('');

  const formatUrl = (raw: string) => {
    let formatted = raw.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    return formatted;
  };

  const navigateTo = useCallback((targetUrl: string) => {
    if (!targetUrl.trim()) return;
    const formatted = formatUrl(targetUrl);

    setCurrentUrl(formatted);
    setUrlInput(formatted);
    setIsLoading(true);
    setIframeError(false);

    // Update history
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIdx + 1), formatted];
      setHistoryIdx(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIdx]);

  const goBack = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      const prevUrl = history[newIdx];
      setCurrentUrl(prevUrl);
      setUrlInput(prevUrl);
      setIsLoading(true);
      setIframeError(false);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      const nextUrl = history[newIdx];
      setCurrentUrl(nextUrl);
      setUrlInput(nextUrl);
      setIsLoading(true);
      setIframeError(false);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  const handleAddToCart = async () => {
    const urlToCapture = currentUrl || formatUrl(urlInput);
    if (!urlToCapture.trim()) {
      toast({ title: 'No URL', description: 'Navigate to a product page or paste a URL first', variant: 'destructive' });
      return;
    }

    setCaptureUrl(urlToCapture);
    setScrapedData(null);
    setIsModalOpen(true);
    setIsScraping(true);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: urlToCapture, mode: 'product' },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setScrapedData(data.data as ScrapedProduct);
      } else {
        toast({ title: 'Auto-detect limited', description: 'Please fill in the product details manually' });
      }
    } catch (err: any) {
      console.error('Scrape error:', err);
      toast({ title: 'Auto-detect failed', description: 'Please fill in the details manually' });
    } finally {
      setIsScraping(false);
    }
  };

  const handleCartSubmit = (item: any) => {
    if (!user) return;
    addItem.mutate({ ...item, user_id: user.id });
    setScrapedData(null);
  };

  const quickStores = [
    { name: 'Amazon', url: 'https://www.amazon.com' },
    { name: 'eBay', url: 'https://www.ebay.com' },
    { name: 'AliExpress', url: 'https://www.aliexpress.com' },
    { name: 'Walmart', url: 'https://www.walmart.com' },
    { name: 'Zara', url: 'https://www.zara.com' },
    { name: 'ASOS', url: 'https://www.asos.com' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-3">
        {/* Top Bar */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-bold">Buy For Me</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/cart')}
              className="relative"
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <Badge className="ml-1 bg-nectarine-500 text-white hover:bg-nectarine-600 text-xs px-1.5">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/bfm-orders')}
            >
              My Orders
            </Button>
          </div>
        </div>

        {/* Browser Chrome */}
        <div className="bg-muted/50 border rounded-lg flex-1 flex flex-col overflow-hidden">
          {/* URL Bar */}
          <div className="flex items-center gap-1.5 p-2 bg-muted border-b">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goBack} disabled={historyIdx <= 0}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goForward} disabled={historyIdx >= history.length - 1}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => currentUrl && navigateTo(currentUrl)}
              disabled={isLoading || !currentUrl}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && navigateTo(urlInput)}
                placeholder="Enter a URL (e.g. amazon.com)"
                className="h-8 pl-8 text-sm bg-background"
              />
            </div>

            <Button
              size="sm"
              className="h-8 flex-shrink-0"
              onClick={() => navigateTo(urlInput)}
              disabled={isLoading || !urlInput.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              size="sm"
              className="h-8 bg-nectarine-500 hover:bg-nectarine-600 flex-shrink-0"
              onClick={handleAddToCart}
              disabled={!currentUrl && !urlInput.trim()}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add to Nectarine Cart
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative">
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-nectarine-500" />
                <p className="text-sm text-muted-foreground">Loading page...</p>
              </div>
            )}

            {currentUrl ? (
              <>
                {/* The actual iframe browser */}
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title="Shopping browser"
                />

                {/* Iframe blocked overlay — shown after load if site uses X-Frame-Options */}
                {iframeError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background gap-4 p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-500" />
                    <div className="text-center max-w-md">
                      <h3 className="font-semibold text-lg mb-2">This site can't be displayed here</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Some websites block embedded browsing for security reasons.
                        You can open this store in a new tab, find your product, then paste the product URL back here.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <a href={currentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in New Tab
                        </a>
                      </Button>
                      <Button
                        className="bg-nectarine-500 hover:bg-nectarine-600"
                        onClick={handleAddToCart}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Current URL to Cart
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Welcome / Empty state */
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                <div className="bg-nectarine-100 dark:bg-nectarine-900/30 rounded-full p-6">
                  <Globe className="h-12 w-12 text-nectarine-500" />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold mb-2">Shop Any Store</h2>
                  <p className="text-muted-foreground text-sm">
                    Enter a store URL in the address bar above to start browsing.
                    Navigate the site just like a normal browser — find a product you like, then click
                    <strong> "Add to Nectarine Cart"</strong> to capture it.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickStores.map(store => (
                    <Button
                      key={store.name}
                      variant="outline"
                      size="sm"
                      onClick={() => { setUrlInput(store.url); navigateTo(store.url); }}
                      className="text-xs"
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      {store.name}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 border-t pt-4 w-full max-w-md">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Or paste a direct product link:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste product URL here..."
                      className="text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          setCaptureUrl(val);
                          setUrlInput(val);
                          handleAddToCart();
                        }
                      }}
                      onChange={e => {
                        setCaptureUrl(e.target.value);
                        setUrlInput(e.target.value);
                      }}
                    />
                    <Button
                      size="sm"
                      className="bg-nectarine-500 hover:bg-nectarine-600"
                      onClick={handleAddToCart}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Quick Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddToCartModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        scrapedData={scrapedData}
        productUrl={captureUrl || currentUrl}
        isLoading={isScraping}
        onAddToCart={handleCartSubmit}
      />
    </DashboardLayout>
  );
};

export default BfmShop;
