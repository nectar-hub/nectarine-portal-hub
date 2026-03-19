import { useState } from "react";
import { ShippingRate } from "@/hooks/useShippingRates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Package, Weight, Ruler } from "lucide-react";

interface ShippingEstimate {
  originCountry: string;
  weightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  ratePerKg: number;
  currencySymbol: string;
  currencyCode: string;
  estimatedCost: number;
}

interface Props {
  rates: ShippingRate[];
  loading: boolean;
}

export function ShippingCalculatorForm({ rates, loading }: Props) {
  const [originCountry, setOriginCountry] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);

  const activeRates = rates.filter((r) => r.is_active);

  const handleCalculate = () => {
    const country = activeRates.find((c) => c.country_code === originCountry);
    if (!country || !weightKg) return;

    const weight = parseFloat(weightKg);
    const length = parseFloat(lengthCm) || 0;
    const width = parseFloat(widthCm) || 0;
    const height = parseFloat(heightCm) || 0;

    const volumetricWeight =
      length > 0 && width > 0 && height > 0 ? (length * width * height) / 5000 : 0;

    const chargeableWeight = Math.ceil(Math.max(weight, volumetricWeight));
    const estimatedCost = chargeableWeight * country.rate_per_kg;

    setEstimate({
      originCountry: country.country_name,
      weightKg: weight,
      volumetricWeightKg: Math.round(volumetricWeight * 100) / 100,
      chargeableWeightKg: chargeableWeight,
      ratePerKg: country.rate_per_kg,
      currencySymbol: country.currency_symbol,
      currencyCode: country.currency_code,
      estimatedCost,
    });
  };

  const handleReset = () => {
    setOriginCountry("");
    setWeightKg("");
    setLengthCm("");
    setWidthCm("");
    setHeightCm("");
    setEstimate(null);
  };

  const isFormValid = originCountry && weightKg && parseFloat(weightKg) > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculate Shipping Cost
          </CardTitle>
          <CardDescription>Enter your shipment details to get an estimate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="origin">Origin Country</Label>
            <Select value={originCountry} onValueChange={setOriginCountry}>
              <SelectTrigger id="origin">
                <SelectValue placeholder={loading ? "Loading countries..." : "Select origin country"} />
              </SelectTrigger>
              <SelectContent>
                {activeRates.map((c) => (
                  <SelectItem key={c.country_code} value={c.country_code}>
                    {c.country_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-1.5">
              <Weight className="h-3.5 w-3.5" />
              Weight (kg)
            </Label>
            <Input id="weight" type="number" min="0.1" step="0.1" placeholder="e.g. 5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              Dimensions (cm)
              <span className="text-xs text-muted-foreground font-normal">— optional</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" min="0" step="0.1" placeholder="Length" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
              <Input type="number" min="0" step="0.1" placeholder="Width" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
              <Input type="number" min="0" step="0.1" placeholder="Height" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCalculate} disabled={!isFormValid} className="flex-1">
              Calculate Cost
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={`transition-opacity duration-300 ${estimate ? "opacity-100" : "opacity-50"}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Estimate
          </CardTitle>
          <CardDescription>
            {estimate ? `Shipping from ${estimate.originCountry} to Tanzania` : "Fill in the form and click Calculate"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estimate ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Actual Weight</p>
                  <p className="text-lg font-semibold">{estimate.weightKg} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Volumetric Weight</p>
                  <p className="text-lg font-semibold">
                    {estimate.volumetricWeightKg > 0 ? `${estimate.volumetricWeightKg} kg` : "N/A"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Chargeable Weight</p>
                  <p className="text-lg font-semibold">{estimate.chargeableWeightKg} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Rate per kg</p>
                  <p className="text-lg font-semibold">{estimate.currencySymbol}{estimate.ratePerKg}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Estimated Shipping Cost</p>
                <p className="text-3xl font-bold text-primary">
                  {estimate.currencySymbol}{estimate.estimatedCost.toFixed(2)}
                  <span className="text-base font-normal text-muted-foreground ml-2">{estimate.currencyCode}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {estimate.chargeableWeightKg} kg × {estimate.currencySymbol}{estimate.ratePerKg}/kg
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                * This is an estimate. Final costs may vary based on actual dimensions, customs fees, and other factors.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Calculator className="h-12 w-12 mb-3 opacity-30" />
              <p>Your shipping estimate will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
