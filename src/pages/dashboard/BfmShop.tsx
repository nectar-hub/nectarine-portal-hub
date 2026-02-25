import { useState, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useBfmCart } from '@/hooks/useBfmCart';
import { AddToCartModal } from '@/components/bfm/AddToCartModal';
import { ProductCard } from '@/components/bfm/ProductCard';
import { StoreSelector } from '@/components/bfm/StoreSelector';
import { SearchResultsSkeleton } from '@/components/bfm/SearchResultsSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart, Search, Plus, Loader2, Link2, Globe,
  RotateCcw, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScrapedProduct } from '@/types/bfm';
import type { SearchProduct, StoreKey, StoreSearchResult } from '@/types/store-search';

const BfmShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem, cartCount } = useBfmCart();

  // Search state
  const [selectedStore, setSelectedStore] = useState<StoreKey>('amazon');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ query: string; store: string; search_url: string; next_page_url: string | null } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Paste URL state
  const [pasteUrl, setPasteUrl] = useState('');
  const [isPasteScraping, setIsPasteScraping] = useState(false);

  // Cart modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [captureUrl, setCaptureUrl] = useState('');

  const handleSearch = useCallback(async (page = 1) => {
    if (!searchQuery.trim()) return;

    if (page === 1) {
      setIsSearching(true);
      setSearchResults([]);
      setSearchError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-search', {
        body: { store: selectedStore, query: searchQuery.trim(), page },
      });

      if (error) throw error;

      const result = data as StoreSearchResult;
      if (!result.success) throw new Error(result.error || 'Search failed');

      if (page === 1) {
        setSearchResults(result.items);
      } else {
        setSearchResults(prev => [...prev, ...result.items]);
      }

      setSearchMeta({
        query: result.query,
        store: result.store,
        search_url: result.search_url,
        next_page_url: result.next_page_url,
      });
      setCurrentPage(page);

      // Track recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())].slice(0, 5);
        return updated;
      });
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Search failed. Try pasting a product URL instead.');
      if (page === 1) setSearchResults([]);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, selectedStore]);

  const handleProductAddToCart = async (product: SearchProduct) => {
    const urlToScrape = product.product_url;
    if (!urlToScrape) {
      // No URL, open modal with what we have
      setScrapedData({
        product_name: product.product_name,
        price: product.price,
        currency: product.currency,
        image_url: product.image_url,
        store_name: product.store_name,
        available_sizes: [],
        available_colors: [],
        description: '',
        source_url: '',
      });
      setCaptureUrl('');
      setIsModalOpen(true);
      return;
    }

    setCaptureUrl(urlToScrape);
    setScrapedData({
      product_name: product.product_name,
      price: product.price,
      currency: product.currency,
      image_url: product.image_url,
      store_name: product.store_name,
      available_sizes: [],
      available_colors: [],
      description: '',
      source_url: urlToScrape,
    });
    setIsModalOpen(true);
    setIsScraping(true);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: urlToScrape, mode: 'product' },
      });

      if (error) throw error;
      if (data?.success && data?.data) {
        setScrapedData(data.data as ScrapedProduct);
      }
    } catch (err: any) {
      console.error('Product scrape error:', err);
      // Keep the search data as fallback
    } finally {
      setIsScraping(false);
    }
  };

  const handlePasteUrl = async () => {
    if (!pasteUrl.trim()) return;

    let formatted = pasteUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    setCaptureUrl(formatted);
    setScrapedData(null);
    setIsModalOpen(true);
    setIsScraping(true);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: formatted, mode: 'product' },
      });

      if (error) throw error;
      if (data?.success && data?.data) {
        setScrapedData(data.data as ScrapedProduct);
      } else {
        toast({ title: 'Auto-detect limited', description: 'Please fill in product details manually' });
      }
    } catch {
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Buy For Me</h1>
            <p className="text-sm text-muted-foreground">Search products across stores or paste a link</p>
          </div>
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
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/bfm-orders')}>
              My Orders
            </Button>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="search">
              <Search className="mr-1.5 h-4 w-4" />
              Store Search
            </TabsTrigger>
            <TabsTrigger value="paste">
              <Link2 className="mr-1.5 h-4 w-4" />
              Paste Product URL
            </TabsTrigger>
          </TabsList>

          {/* ===== SEARCH TAB ===== */}
          <TabsContent value="search" className="space-y-4 mt-4">
            {/* Store selector */}
            <StoreSelector selected={selectedStore} onSelect={setSelectedStore} />

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={`Search on ${selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1)}...`}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-nectarine-500 hover:bg-nectarine-600"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {/* Recent searches */}
            {recentSearches.length > 0 && !searchResults.length && !isSearching && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Recent:</span>
                {recentSearches.map(s => (
                  <Button
                    key={s}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => { setSearchQuery(s); }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* Error state */}
            {searchError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Search failed</p>
                  <p className="text-xs text-muted-foreground mt-1">{searchError}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => handleSearch()}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Loading */}
            {isSearching && <SearchResultsSkeleton />}

            {/* Results */}
            {!isSearching && searchResults.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} products found
                    {searchMeta?.store && ` on ${searchMeta.store}`}
                  </p>
                  {searchMeta?.search_url && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                      <a href={searchMeta.search_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-1 h-3 w-3" /> Open on store
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults.map((product, idx) => (
                    <ProductCard
                      key={`${product.product_url || idx}-${idx}`}
                      product={product}
                      onAddToCart={handleProductAddToCart}
                    />
                  ))}
                </div>

                {/* Load more */}
                {searchMeta?.next_page_url && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSearch(currentPage + 1)}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!isSearching && !searchError && searchResults.length === 0 && !searchMeta && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="bg-nectarine-100 dark:bg-nectarine-900/30 rounded-full p-5">
                  <Search className="h-10 w-10 text-nectarine-500" />
                </div>
                <div className="text-center max-w-sm">
                  <h2 className="text-lg font-semibold mb-1">Search Any Store</h2>
                  <p className="text-sm text-muted-foreground">
                    Select a store above, type what you're looking for, and hit Search.
                    We'll find products for you to add to your Nectarine Cart.
                  </p>
                </div>
              </div>
            )}

            {/* No results after search */}
            {!isSearching && searchResults.length === 0 && searchMeta && !searchError && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No products found. Try a different search term or store.</p>
              </div>
            )}
          </TabsContent>

          {/* ===== PASTE URL TAB ===== */}
          <TabsContent value="paste" className="mt-4">
            <div className="max-w-lg mx-auto space-y-6">
              <div className="flex flex-col items-center text-center gap-3 py-8">
                <div className="bg-nectarine-100 dark:bg-nectarine-900/30 rounded-full p-5">
                  <Link2 className="h-10 w-10 text-nectarine-500" />
                </div>
                <h2 className="text-lg font-semibold">Paste a Product Link</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Found something on any online store? Paste the product URL and we'll
                  extract the details for you.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={pasteUrl}
                  onChange={e => setPasteUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasteUrl()}
                  placeholder="https://www.amazon.com/dp/..."
                  className="flex-1"
                />
                <Button
                  onClick={handlePasteUrl}
                  disabled={isPasteScraping || !pasteUrl.trim()}
                  className="bg-nectarine-500 hover:bg-nectarine-600"
                >
                  {isPasteScraping ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                  Fetch Product
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Cart CTA */}
        {cartCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Button
              size="lg"
              className="bg-nectarine-500 hover:bg-nectarine-600 shadow-xl rounded-full px-8"
              onClick={() => navigate('/dashboard/cart')}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Proceed to Checkout ({cartCount} items)
            </Button>
          </div>
        )}
      </div>

      <AddToCartModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        scrapedData={scrapedData}
        productUrl={captureUrl}
        isLoading={isScraping}
        onAddToCart={handleCartSubmit}
      />
    </DashboardLayout>
  );
};

export default BfmShop;
