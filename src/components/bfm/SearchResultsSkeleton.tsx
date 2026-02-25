import { Skeleton } from '@/components/ui/skeleton';

export const ProductCardSkeleton = () => (
  <div className="border rounded-xl overflow-hidden bg-card">
    <Skeleton className="aspect-square w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full mt-2" />
    </div>
  </div>
);

export const SearchResultsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);
