import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CurrenciesGrid } from '@/components/multi-currency/CurrenciesGrid';
import { CurrencyFormDialog } from '@/components/multi-currency/CurrencyFormDialog';
import { ExchangeRatesGrid } from '@/components/multi-currency/ExchangeRatesGrid';
import { ExchangeRateFormDialog } from '@/components/multi-currency/ExchangeRateFormDialog';
import { ExchangeRatesToolbar } from '@/components/multi-currency/ExchangeRatesToolbar';
import { ConversionPreview } from '@/components/multi-currency/ConversionPreview';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { Currency, CurrencyFormData, ExchangeRate, ExchangeRateFormData } from '@/types/currency';
import { Loader2, Plus, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MultiCurrency = () => {
  const { isSuperadmin } = useAuth();
  // Default to 'preview' tab for non-superadmins
  const [activeTab, setActiveTab] = useState(isSuperadmin ? 'currencies' : 'preview');
  
  // Redirect to preview if non-superadmin tries to access restricted tabs
  useEffect(() => {
    if (!isSuperadmin && (activeTab === 'currencies' || activeTab === 'rates')) {
      setActiveTab('preview');
    }
  }, [isSuperadmin, activeTab]);
  
  // Currency state
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | undefined>();
  
  // Exchange rate state
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | undefined>();
  const [rateSearchQuery, setRateSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  const {
    currencies,
    baseCurrency,
    isLoading: currenciesLoading,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    setBaseCurrency,
    toggleActive: toggleCurrencyActive,
    isCreating: isCreatingCurrency,
    isUpdating: isUpdatingCurrency,
  } = useCurrencies();

  const {
    exchangeRates,
    isLoading: ratesLoading,
    createRate,
    updateRate,
    deleteRate,
    toggleActive: toggleRateActive,
    isCreating: isCreatingRate,
    isUpdating: isUpdatingRate,
  } = useExchangeRates();

  // Filter exchange rates
  const filteredRates = useMemo(() => {
    if (!exchangeRates) return [];
    
    return exchangeRates.filter((rate) => {
      const matchesCurrency = currencyFilter === 'all' ||
        rate.base_currency === currencyFilter ||
        rate.quote_currency === currencyFilter;
      
      const matchesSearch = !rateSearchQuery ||
        rate.base_currency.toLowerCase().includes(rateSearchQuery.toLowerCase()) ||
        rate.quote_currency.toLowerCase().includes(rateSearchQuery.toLowerCase()) ||
        (rate.notes?.toLowerCase().includes(rateSearchQuery.toLowerCase()));

      return matchesCurrency && matchesSearch;
    });
  }, [exchangeRates, currencyFilter, rateSearchQuery]);

  // Currency handlers
  const handleAddCurrency = () => {
    setEditingCurrency(undefined);
    setCurrencyDialogOpen(true);
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyDialogOpen(true);
  };

  const handleCurrencySubmit = (data: CurrencyFormData) => {
    if (editingCurrency) {
      updateCurrency({ code: editingCurrency.code, ...data });
    } else {
      createCurrency(data);
    }
    setCurrencyDialogOpen(false);
    setEditingCurrency(undefined);
  };

  // Exchange rate handlers
  const handleAddRate = () => {
    setEditingRate(undefined);
    setRateDialogOpen(true);
  };

  const handleEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setRateDialogOpen(true);
  };

  const handleRateSubmit = (data: ExchangeRateFormData) => {
    if (editingRate) {
      updateRate({ id: editingRate.id, ...data });
    } else {
      createRate(data);
    }
    setRateDialogOpen(false);
    setEditingRate(undefined);
  };

  const isLoading = currenciesLoading || ratesLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Multi-Currency"
          description="Manage system currencies and exchange rates for accurate conversions across all modules"
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {isSuperadmin && (
                <>
                  <TabsTrigger value="currencies">Currencies</TabsTrigger>
                  <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
                </>
              )}
              <TabsTrigger value="preview">Conversion Preview</TabsTrigger>
            </TabsList>

            {!isSuperadmin && (
              <Alert className="mt-4 mb-2">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Currency and exchange rate management is restricted to superadmins. You can use the Conversion Preview to check rates.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="currencies" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddCurrency}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Currency
                </Button>
              </div>

              <CurrenciesGrid
                currencies={currencies || []}
                onEdit={handleEditCurrency}
                onDelete={deleteCurrency}
                onToggleActive={(code, isActive) => toggleCurrencyActive({ code, is_active: isActive })}
                onSetBase={setBaseCurrency}
              />

              <CurrencyFormDialog
                open={currencyDialogOpen}
                onOpenChange={setCurrencyDialogOpen}
                currency={editingCurrency}
                onSubmit={handleCurrencySubmit}
                isSubmitting={isCreatingCurrency || isUpdatingCurrency}
              />
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <ExchangeRatesToolbar
                searchQuery={rateSearchQuery}
                onSearchChange={setRateSearchQuery}
                currencyFilter={currencyFilter}
                onCurrencyFilterChange={setCurrencyFilter}
                currencies={currencies || []}
                onAddClick={handleAddRate}
                rates={filteredRates}
              />

              <ExchangeRatesGrid
                rates={filteredRates}
                onEdit={handleEditRate}
                onDelete={deleteRate}
                onToggleActive={(id, isActive) => toggleRateActive({ id, is_active: isActive })}
              />

              <ExchangeRateFormDialog
                open={rateDialogOpen}
                onOpenChange={setRateDialogOpen}
                currencies={currencies || []}
                rate={editingRate}
                onSubmit={handleRateSubmit}
                isSubmitting={isCreatingRate || isUpdatingRate}
              />
            </TabsContent>

            <TabsContent value="preview">
              <ConversionPreview
                currencies={currencies || []}
                baseCurrency={baseCurrency}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MultiCurrency;
