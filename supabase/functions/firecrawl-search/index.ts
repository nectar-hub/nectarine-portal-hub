const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STORE_SEARCH_URLS: Record<string, (q: string) => string> = {
  amazon: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  ebay: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`,
  walmart: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  aliexpress: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`,
  zara: (q) => `https://www.zara.com/us/en/search?searchTerm=${encodeURIComponent(q)}`,
  asos: (q) => `https://www.asos.com/search/?q=${encodeURIComponent(q)}`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store, query, page } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const storeKey = (store || 'amazon').toLowerCase();
    const urlBuilder = STORE_SEARCH_URLS[storeKey];

    let searchUrl: string;
    if (urlBuilder) {
      searchUrl = urlBuilder(query);
      // Add pagination for supported stores
      if (page && page > 1) {
        if (storeKey === 'amazon') searchUrl += `&page=${page}`;
        else if (storeKey === 'ebay') searchUrl += `&_pgn=${page}`;
        else if (storeKey === 'walmart') searchUrl += `&page=${page}`;
        else if (storeKey === 'aliexpress') searchUrl += `&page=${page}`;
      }
    } else {
      // Generic: use a web search scoped to the store
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' site:' + storeKey)}`;
    }

    console.log('Store search:', storeKey, 'query:', query, 'url:', searchUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['extract', 'links'],
        onlyMainContent: true,
        timeout: 30000,
        waitFor: 3000,
        extract: {
          schema: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    product_name: { type: 'string', description: 'Product title/name' },
                    product_url: { type: 'string', description: 'Full absolute URL to the product page' },
                    image_url: { type: 'string', description: 'Product image URL (full absolute URL)' },
                    price: { type: 'number', description: 'Price as a number without currency symbol' },
                    currency: { type: 'string', description: 'Currency code like USD, GBP, EUR' },
                    store_name: { type: 'string', description: 'Store or brand name' },
                  },
                  required: ['product_name'],
                },
                description: 'Array of product listings found on this search results page. Extract up to 20 products.',
              },
            },
            required: ['products'],
          },
          prompt: `Extract all product listings from this search results page. For each product, get the product name, absolute URL to its detail page, image URL, numeric price, currency code, and store name. Return up to 20 products. Make sure all URLs are absolute (start with http).`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl search error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractData = data.data?.extract || data.extract || {};
    const links = data.data?.links || data.links || [];
    const products = (extractData.products || []).map((p: any) => ({
      product_name: p.product_name || 'Unknown Product',
      product_url: p.product_url || '',
      image_url: p.image_url || '',
      price: typeof p.price === 'number' ? p.price : null,
      currency: p.currency || 'USD',
      store_name: p.store_name || storeKey,
    }));

    // Try to find next page URL from links
    const nextPageUrl = links.find((l: string) =>
      l.includes('page=') || l.includes('_pgn=') || l.includes('start=')
    ) || null;

    console.log('Search returned', products.length, 'products for', storeKey, query);

    return new Response(
      JSON.stringify({
        success: true,
        store: storeKey,
        query,
        search_url: searchUrl,
        items: products,
        next_page_url: nextPageUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
