import { useState, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useBfmCart } from '@/hooks/useBfmCart';
import { AddToCartModal } from '@/components/bfm/AddToCartModal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart, ArrowLeft, ArrowRight, RotateCcw, Globe,
  Plus, ExternalLink, Loader2, Link2, Home,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScrapedProduct } from '@/types/bfm';

interface BrowseResult {
  markdown: string;
  screenshot: string;
  links: string[];
  metadata: {
    title?: string;
    description?: string;
    ogImage?: string;
    sourceURL?: string;
  };
}

const BfmShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem, cartCount, cartTotal } = useBfmCart();

  // Browser state
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Cart modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [captureUrl, setCaptureUrl] = useState('');

  const browseTo = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    let formatted = targetUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    setCurrentUrl(formatted);
    setUrlInput(formatted);
    setIsBrowsing(true);
    setBrowseResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: formatted, mode: 'browse' },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setBrowseResult(data.data);
        // Add to history
        setHistory(prev => {
          const newHistory = [...prev.slice(0, historyIdx + 1), formatted];
          setHistoryIdx(newHistory.length - 1);
          return newHistory;
        });
      } else {
        toast({ title: 'Failed to load page', description: data?.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Browse error:', err);
      toast({ title: 'Failed to load page', description: err.message, variant: 'destructive' });
    } finally {
      setIsBrowsing(false);
    }
  }, [historyIdx]);

  const goBack = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      const prevUrl = history[newIdx];
      setCurrentUrl(prevUrl);
      setUrlInput(prevUrl);
      browseTo(prevUrl);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      const nextUrl = history[newIdx];
      setCurrentUrl(nextUrl);
      setUrlInput(nextUrl);
      browseTo(nextUrl);
    }
  };

  const handleAddToCart = async () => {
    const urlToCapture = currentUrl || urlInput;
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

  const handleLinkClick = (link: string) => {
    browseTo(link);
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={goBack}
              disabled={historyIdx <= 0}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={goForward}
              disabled={historyIdx >= history.length - 1}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => currentUrl && browseTo(currentUrl)}
              disabled={isBrowsing || !currentUrl}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && browseTo(urlInput)}
                placeholder="Enter a URL (e.g. amazon.com/product/...)"
                className="h-8 pl-8 text-sm bg-background"
              />
            </div>

            <Button
              size="sm"
              className="h-8 flex-shrink-0"
              onClick={() => browseTo(urlInput)}
              disabled={isBrowsing || !urlInput.trim()}
            >
              {isBrowsing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
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

          {/* Page title bar */}
          {browseResult?.metadata?.title && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-background/50 border-b text-xs">
              <span className="truncate font-medium">{browseResult.metadata.title}</span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-nectarine-500 hover:underline flex-shrink-0 ml-2"
              >
                <ExternalLink className="h-3 w-3" /> Open in new tab
              </a>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {isBrowsing ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-nectarine-500" />
                <p className="text-sm text-muted-foreground">Loading page...</p>
              </div>
            ) : browseResult ? (
              <div className="flex h-full">
                {/* Main content */}
                <ScrollArea className="flex-1 h-full">
                  <div className="p-4">
                    {/* Screenshot */}
                    {browseResult.screenshot && (
                      <div className="mb-6">
                        <img
                          src={`data:image/png;base64,${browseResult.screenshot}`}
                          alt="Page screenshot"
                          className="w-full rounded-lg border shadow-sm"
                        />
                      </div>
                    )}

                    {/* Markdown content */}
                    {browseResult.markdown && (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {browseResult.markdown.split('\n').map((line, i) => {
                          if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                          if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-3 mb-2">{line.slice(3)}</h2>;
                          if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-2 mb-1">{line.slice(4)}</h3>;
                          if (line.startsWith('![')) {
                            const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                            if (match) return <img key={i} src={match[2]} alt={match[1]} className="max-w-full rounded my-2" />;
                          }
                          if (line.trim() === '') return <br key={i} />;
                          return <p key={i} className="text-sm mb-1">{line}</p>;
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Links sidebar */}
                {browseResult.links && browseResult.links.length > 0 && (
                  <div className="w-64 border-l bg-muted/30 flex-shrink-0 hidden lg:block">
                    <div className="p-2 border-b">
                      <p className="text-xs font-medium text-muted-foreground">Links on page ({browseResult.links.length})</p>
                    </div>
                    <ScrollArea className="h-full">
                      <div className="p-2 space-y-1">
                        {browseResult.links.slice(0, 50).map((link, i) => (
                          <button
                            key={i}
                            onClick={() => handleLinkClick(link)}
                            className="block w-full text-left text-xs text-nectarine-600 hover:text-nectarine-700 hover:bg-muted p-1.5 rounded truncate"
                            title={link}
                          >
                            {link.replace(/^https?:\/\//, '').slice(0, 60)}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              /* Welcome / Empty state */
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                <div className="bg-nectarine-100 dark:bg-nectarine-900/30 rounded-full p-6">
                  <Globe className="h-12 w-12 text-nectarine-500" />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold mb-2">Shop Any Store</h2>
                  <p className="text-muted-foreground text-sm">
                    Enter a product URL in the address bar above to browse any online store.
                    When you find a product you like, click <strong>"Add to Nectarine Cart"</strong> to capture it.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { name: 'Amazon', url: 'https://www.amazon.com' },
                    { name: 'eBay', url: 'https://www.ebay.com' },
                    { name: 'AliExpress', url: 'https://www.aliexpress.com' },
                    { name: 'Walmart', url: 'https://www.walmart.com' },
                    { name: 'Zara', url: 'https://www.zara.com' },
                    { name: 'ASOS', url: 'https://www.asos.com' },
                  ].map(store => (
                    <Button
                      key={store.name}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrlInput(store.url);
                        browseTo(store.url);
                      }}
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
