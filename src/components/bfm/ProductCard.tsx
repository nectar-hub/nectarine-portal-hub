import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import type { SearchProduct } from '@/types/store-search';

interface ProductCardProps {
  product: SearchProduct;
  onAddToCart: (product: SearchProduct) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Price N/A';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
    } catch {
      return `${currency} ${price.toFixed(2)}`;
    }
  };

  return (
    <div className="group border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        {product.store_name && (
          <span className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-[10px] font-medium px-2 py-0.5 rounded-full border">
            {product.store_name}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <h3 className="text-sm font-medium leading-tight line-clamp-2 flex-1">
          {product.product_name}
        </h3>
        <p className="text-base font-bold text-primary">
          {formatPrice(product.price, product.currency)}
        </p>
        <div className="flex gap-1.5 mt-auto">
          <Button
            size="sm"
            className="flex-1 bg-nectarine-500 hover:bg-nectarine-600 text-xs h-8"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="mr-1 h-3 w-3" />
            Add to Cart
          </Button>
          {product.product_url && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
              <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
