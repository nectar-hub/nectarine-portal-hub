import { Button } from '@/components/ui/button';
import { STORES } from '@/types/store-search';
import type { StoreKey } from '@/types/store-search';
import { cn } from '@/lib/utils';

interface StoreSelectorProps {
  selected: StoreKey;
  onSelect: (store: StoreKey) => void;
}

export const StoreSelector = ({ selected, onSelect }: StoreSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {STORES.map((store) => (
        <Button
          key={store.key}
          variant={selected === store.key ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'text-xs h-9 px-3',
            selected === store.key && 'bg-nectarine-500 hover:bg-nectarine-600 text-white'
          )}
          onClick={() => onSelect(store.key)}
        >
          <span className="mr-1.5">{store.icon}</span>
          {store.name}
        </Button>
      ))}
    </div>
  );
};
