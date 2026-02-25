import { useState, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useBfmCart } from '@/hooks/useBfmCart';
import { AddToCartModal } from '@/components/bfm/AddToCartModal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart, ArrowLeft, ArrowRight, RotateCcw, Globe,
  Plus, ExternalLink, Loader2, Link2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScrapedProduct } from '@/types/bfm';

interface BrowseResult {
  screenshot: string;
  links: string[];
  metadata: { title?: string; ogImage?: string };
  markdown: string;
}

const BfmShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem, cartCount } = useBfmCart();

  // Browser state
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [browseData, setBrowseData] = useState<BrowseResult | null>(null);
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

  const browseTo = useCallback(async (targetUrl: string, addToHistory = true) => {
    if (!targetUrl.trim()) return;
    const formatted = formatUrl(targetUrl);

    setCurrentUrl(formatted);
    setUrlInput(formatted);
    setIsLoading(true);
    setBrowseData(null);

    if (addToHistory) {
      setHistory(prev => {
        const newHistory = [...prev.slice(0, historyIdx + 1), formatted];
        setHistoryIdx(newHistory.length - 1);
        return newHistory;
      });
    }

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: formatted, mode: 'browse' },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const result = data.data as BrowseResult;
        // Filter links to only valid http(s) links
        const validLinks = (result.links || []).filter(
          (l: string) => l.startsWith('http://') || l.startsWith('https://')
        );
        setBrowseData({ ...result, links: validLinks });
      } else {
        toast({ title: 'Could not load page', description: 'Try opening in a new tab instead', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Browse error:', err);
      toast({ title: 'Failed to load page', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [historyIdx]);

  const goBack = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      browseTo(history[newIdx], false);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      browseTo(history[newIdx], false);
    }
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

  const getDomain = (url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  };

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
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goBack} disabled={historyIdx <= 0 || isLoading}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goForward} disabled={historyIdx >= history.length - 1 || isLoading}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => currentUrl && browseTo(currentUrl, false)}
              disabled={isLoading || !currentUrl}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && browseTo(urlInput)}
                placeholder="Enter a URL (e.g. amazon.com)"
                className="h-8 pl-8 text-sm bg-background"
              />
            </div>

            <Button
              size="sm"
              className="h-8 flex-shrink-0"
              onClick={() => browseTo(urlInput)}
              disabled={isLoading || !urlInput.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              size="sm"
              className="h-8 bg-nectarine-500 hover:bg-nectarine-600 flex-shrink-0"
              onClick={handleAddToCart}
              disabled={(!currentUrl && !urlInput.trim()) || isLoading}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add to Nectarine Cart
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative flex">
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-nectarine-500" />
                <p className="text-sm text-muted-foreground">Loading page...</p>
              </div>
            )}

            {browseData ? (
              <>
                {/* Page screenshot */}
                <ScrollArea className="flex-1">
                  <div className="p-0">
                    {browseData.screenshot ? (
                      <img
                        src={browseData.screenshot}
                        alt={browseData.metadata?.title || 'Page screenshot'}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="p-6 text-sm text-muted-foreground whitespace-pre-wrap">
                        {browseData.markdown || 'No content available for this page.'}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Links sidebar */}
                {browseData.links.length > 0 && (
                  <div className="w-72 border-l bg-background flex flex-col flex-shrink-0">
                    <div className="p-3 border-b flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        Links on page
                      </span>
                      <Button variant="outline" size="sm" className="h-6 text-xs" asChild>
                        <a href={currentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" /> Open
                        </a>
                      </Button>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {browseData.links.slice(0, 50).map((link, i) => (
                          <button
                            key={i}
                            onClick={() => browseTo(link)}
                            disabled={isLoading}
                            className="w-full text-left text-xs p-2 rounded-md hover:bg-muted transition-colors truncate block text-primary underline-offset-2 hover:underline disabled:opacity-50"
                            title={link}
                          >
                            {getDomain(link) !== getDomain(currentUrl)
                              ? getDomain(link)
                              : link.replace(/https?:\/\/[^/]+/, '').slice(0, 60) || '/'
                            }
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            ) : !currentUrl ? (
              /* Welcome / Empty state */
              <div className="flex flex-col items-center justify-center h-full w-full gap-6 p-8">
                <div className="bg-nectarine-100 dark:bg-nectarine-900/30 rounded-full p-6">
                  <Globe className="h-12 w-12 text-nectarine-500" />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold mb-2">Shop Any Store</h2>
                  <p className="text-muted-foreground text-sm">
                    Enter a store URL in the address bar above to start browsing.
                    Find a product you like, then click
                    <strong> "Add to Nectarine Cart"</strong> to capture it.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickStores.map(store => (
                    <Button
                      key={store.name}
                      variant="outline"
                      size="sm"
                      onClick={() => { setUrlInput(store.url); browseTo(store.url); }}
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
            ) : null}
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
