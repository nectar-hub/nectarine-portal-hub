const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl, 'mode:', mode || 'product');

    // Build request body based on mode
    const requestBody: Record<string, unknown> = {
      url: formattedUrl,
      onlyMainContent: true,
      waitFor: 3000,
    };

    if (mode === 'browse') {
      // Browse mode: get screenshot + markdown + links for rendering the page
      requestBody.formats = ['markdown', 'screenshot', 'links'];
      requestBody.onlyMainContent = false; // Get full page for browsing
      requestBody.screenshot = true;
    } else {
      // Product mode: extract structured product data
      requestBody.formats = ['extract', 'markdown'];
      requestBody.extract = {
        schema: {
          type: 'object',
          properties: {
            product_name: { type: 'string', description: 'The main product name/title' },
            price: { type: 'number', description: 'The product price as a number without currency symbol' },
            currency: { type: 'string', description: 'Currency code like USD, GBP, EUR' },
            image_url: { type: 'string', description: 'Main product image URL (full absolute URL)' },
            store_name: { type: 'string', description: 'The store or brand name' },
            available_sizes: { type: 'array', items: { type: 'string' }, description: 'Available sizes' },
            available_colors: { type: 'array', items: { type: 'string' }, description: 'Available colors' },
            description: { type: 'string', description: 'Short product description (max 200 chars)' },
          },
          required: ['product_name'],
        },
        prompt: 'Extract product details from this e-commerce page. Get the product name, price (number only), currency code, main product image URL, store/brand name, available sizes, available colors, and a short description.',
      };
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'browse') {
      // Return browse data
      const result = {
        success: true,
        data: {
          markdown: data.data?.markdown || data.markdown || '',
          screenshot: data.data?.screenshot || data.screenshot || '',
          links: data.data?.links || data.links || [],
          metadata: data.data?.metadata || data.metadata || {},
        },
      };
      console.log('Browse successful, title:', result.data.metadata?.title);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Product extraction mode
    const extractData = data.data?.extract || data.data?.json || data.extract || {};
    const metadata = data.data?.metadata || data.metadata || {};

    const productData = {
      product_name: extractData.product_name || metadata.title || '',
      price: extractData.price || null,
      currency: extractData.currency || 'USD',
      image_url: extractData.image_url || metadata.ogImage || '',
      store_name: extractData.store_name || metadata.ogSiteName || '',
      available_sizes: extractData.available_sizes || [],
      available_colors: extractData.available_colors || [],
      description: extractData.description || metadata.description || '',
      source_url: formattedUrl,
    };

    console.log('Product extracted:', productData.product_name, 'price:', productData.price);

    return new Response(
      JSON.stringify({ success: true, data: productData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
