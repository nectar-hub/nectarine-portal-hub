import { useState } from 'react';
import { Currency, ConversionResult } from '@/types/currency';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency, formatRate } from '@/lib/currency-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConversionPreviewProps {
  currencies: Currency[];
  baseCurrency?: Currency | null;
}

export function ConversionPreview({ currencies, baseCurrency }: ConversionPreviewProps) {
  const { convertAmount } = useExchangeRates();
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('TZS');
  const [date, setDate] = useState<Date>(new Date());
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCurrencies = currencies.filter((c) => c.is_active);

  const handleConvert = async () => {
    setIsConverting(true);
    setError(null);
    setResult(null);

    try {
      const conversionResult = await convertAmount(amount, fromCurrency, toCurrency, date);
      
      if (!conversionResult) {
        setError(`No exchange rate found for ${fromCurrency}/${toCurrency} on ${format(date, 'MMM d, yyyy')}`);
      } else {
        setResult(conversionResult);
      }
    } catch (err) {
      setError('Failed to convert amount. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const getCurrencyByCode = (code: string) => currencies.find((c) => c.code === code);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min={0}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>From Currency</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To Currency</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rate Date</Label>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              className="w-full"
            />
          </div>
        </div>

        <Button onClick={handleConvert} disabled={isConverting} className="w-full sm:w-auto">
          {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Convert
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="rounded-lg border bg-muted/50 p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Original Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(result.original_amount, getCurrencyByCode(result.original_currency) || { symbol: result.original_currency })}
                </p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground" />

              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Converted Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(result.converted_amount, getCurrencyByCode(result.target_currency) || { symbol: result.target_currency })}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="text-muted-foreground">Rate Used: </span>
                <span className="font-medium">{formatRate(result.rate_used)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rate Date: </span>
                <span className="font-medium">{format(new Date(result.rate_date), 'MMM d, yyyy')}</span>
              </div>
              {result.base_equivalent !== null && result.target_currency !== result.base_currency && (
                <div>
                  <span className="text-muted-foreground">Base ({result.base_currency}): </span>
                  <span className="font-medium">
                    {formatCurrency(result.base_equivalent, getCurrencyByCode(result.base_currency) || { symbol: result.base_currency })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {baseCurrency && (
          <p className="text-sm text-muted-foreground">
            System base currency: <strong>{baseCurrency.code}</strong> ({baseCurrency.name})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
