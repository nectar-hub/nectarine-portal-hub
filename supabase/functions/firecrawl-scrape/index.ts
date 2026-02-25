const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

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

    console.log('Scraping product URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          'markdown',
          {
            type: 'json',
            schema: {
              type: 'object',
              properties: {
                product_name: { type: 'string', description: 'The main product name/title' },
                price: { type: 'number', description: 'The product price as a number' },
                currency: { type: 'string', description: 'Currency code like USD, GBP, EUR' },
                image_url: { type: 'string', description: 'Main product image URL' },
                store_name: { type: 'string', description: 'The store or brand name' },
                available_sizes: { type: 'array', items: { type: 'string' }, description: 'Available sizes' },
                available_colors: { type: 'array', items: { type: 'string' }, description: 'Available colors' },
                description: { type: 'string', description: 'Short product description' },
              },
              required: ['product_name'],
            },
            prompt: 'Extract product details from this e-commerce page. Get the product name, price, currency, main image URL, store name, available sizes, available colors, and a short description.',
          },
        ],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract structured product data from response
    const jsonData = data?.data?.json || data?.data?.extract || {};
    const metadata = data?.data?.metadata || {};

    const productData = {
      product_name: jsonData.product_name || metadata.title || '',
      price: jsonData.price || null,
      currency: jsonData.currency || 'USD',
      image_url: jsonData.image_url || metadata.ogImage || '',
      store_name: jsonData.store_name || metadata.ogSiteName || '',
      available_sizes: jsonData.available_sizes || [],
      available_colors: jsonData.available_colors || [],
      description: jsonData.description || metadata.description || '',
      source_url: formattedUrl,
    };

    console.log('Product data extracted:', JSON.stringify(productData));

    return new Response(
      JSON.stringify({ success: true, data: productData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape product';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
