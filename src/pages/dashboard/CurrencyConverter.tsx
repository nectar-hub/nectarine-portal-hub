import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { ConversionPreview } from '@/components/multi-currency/ConversionPreview';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Loader2 } from 'lucide-react';

const CurrencyConverter = () => {
  const { currencies, baseCurrency, isLoading } = useCurrencies();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Currency Converter"
          description="Convert amounts between currencies using the latest exchange rates"
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ConversionPreview
            currencies={currencies || []}
            baseCurrency={baseCurrency}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CurrencyConverter;
