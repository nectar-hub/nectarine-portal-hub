import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import type { RealTimeDay } from '@/types/real-time';

interface RealTimeOpeningBalancesProps {
  day: RealTimeDay | null;
  openingTotal: number;
  onUpdateBalances: (balances: Partial<RealTimeDay>) => void;
}

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

const formatDisplay = (val: number): string => {
  return safeNum(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const RealTimeOpeningBalances = ({
  day,
  openingTotal,
  onUpdateBalances,
}: RealTimeOpeningBalancesProps) => {
  const [balances, setBalances] = useState({
    opening_cash: 0,
    opening_nmb_card: 0,
    opening_mpesa_271: 0,
    opening_crdb: 0,
    opening_crdb_usd: 0,
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (day) {
      setBalances({
        opening_cash: safeNum(day.opening_cash),
        opening_nmb_card: safeNum(day.opening_nmb_card),
        opening_mpesa_271: safeNum(day.opening_mpesa_271),
        opening_crdb: safeNum(day.opening_crdb),
        opening_crdb_usd: safeNum(day.opening_crdb_usd),
      });
      setIsDirty(false);
    }
  }, [day]);

  const handleChange = (field: keyof typeof balances, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBalances((prev) => ({ ...prev, [field]: numValue }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdateBalances(balances);
    setIsDirty(false);
  };

  if (!day) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opening Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No day selected. Create or select a day first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Opening Balances</CardTitle>
        {isDirty && (
          <Button onClick={handleSave} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cash">Cash</Label>
            <Input
              id="cash"
              type="number"
              step="0.01"
              value={balances.opening_cash}
              onChange={(e) => handleChange('opening_cash', e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nmb_card">NMB Card</Label>
            <Input
              id="nmb_card"
              type="number"
              step="0.01"
              value={balances.opening_nmb_card}
              onChange={(e) => handleChange('opening_nmb_card', e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mpesa">MPESA (271)</Label>
            <Input
              id="mpesa"
              type="number"
              step="0.01"
              value={balances.opening_mpesa_271}
              onChange={(e) => handleChange('opening_mpesa_271', e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crdb">CRDB</Label>
            <Input
              id="crdb"
              type="number"
              step="0.01"
              value={balances.opening_crdb}
              onChange={(e) => handleChange('opening_crdb', e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crdb_usd">CRDB USD</Label>
            <Input
              id="crdb_usd"
              type="number"
              step="0.01"
              value={balances.opening_crdb_usd}
              onChange={(e) => handleChange('opening_crdb_usd', e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label>Opening Total</Label>
            <div className="h-10 px-3 py-2 rounded-md border bg-muted text-right font-semibold">
              {formatDisplay(openingTotal)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
