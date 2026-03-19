import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
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

const ORIGIN_COUNTRIES = [
  { value: "US", label: "United States", rate: 12 },
  { value: "UK", label: "United Kingdom", rate: 10 },
  { value: "DE", label: "Germany", rate: 11 },
  { value: "FR", label: "France", rate: 11 },
  { value: "NL", label: "Netherlands", rate: 11 },
  { value: "CN", label: "China", rate: 8 },
  { value: "AE", label: "Dubai (UAE)", rate: 9 },
  { value: "KR", label: "South Korea", rate: 13 },
  { value: "HK", label: "Hong Kong", rate: 10 },
  { value: "CA", label: "Canada", rate: 12 },
];

interface ShippingEstimate {
  originCountry: string;
  weightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  ratePerKg: number;
  estimatedCost: number;
}

const ShippingCalculator = () => {
  const [originCountry, setOriginCountry] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);

  const handleCalculate = () => {
    const country = ORIGIN_COUNTRIES.find((c) => c.value === originCountry);
    if (!country || !weightKg) return;

    const weight = parseFloat(weightKg);
    const length = parseFloat(lengthCm) || 0;
    const width = parseFloat(widthCm) || 0;
    const height = parseFloat(heightCm) || 0;

    const volumetricWeight =
      length > 0 && width > 0 && height > 0
        ? (length * width * height) / 5000
        : 0;

    const chargeableWeight = Math.ceil(Math.max(weight, volumetricWeight));
    const estimatedCost = chargeableWeight * country.rate;

    setEstimate({
      originCountry: country.label,
      weightKg: weight,
      volumetricWeightKg: Math.round(volumetricWeight * 100) / 100,
      chargeableWeightKg: chargeableWeight,
      ratePerKg: country.rate,
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
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Shipping Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Estimate your delivery cost by entering the package size, weight,
            and origin country.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculate Shipping Cost
              </CardTitle>
              <CardDescription>
                Enter your shipment details to get an estimate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin Country</Label>
                <Select value={originCountry} onValueChange={setOriginCountry}>
                  <SelectTrigger id="origin">
                    <SelectValue placeholder="Select origin country" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGIN_COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
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
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" />
                  Dimensions (cm)
                  <span className="text-xs text-muted-foreground font-normal">
                    — optional
                  </span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Length"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Width"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Height"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                  className="flex-1"
                >
                  Calculate Cost
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card
            className={`transition-opacity duration-300 ${estimate ? "opacity-100" : "opacity-50"}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipping Estimate
              </CardTitle>
              <CardDescription>
                {estimate
                  ? `Shipping from ${estimate.originCountry} to Tanzania`
                  : "Fill in the form and click Calculate"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {estimate ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">
                        Actual Weight
                      </p>
                      <p className="text-lg font-semibold">
                        {estimate.weightKg} kg
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">
                        Volumetric Weight
                      </p>
                      <p className="text-lg font-semibold">
                        {estimate.volumetricWeightKg > 0
                          ? `${estimate.volumetricWeightKg} kg`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">
                        Chargeable Weight
                      </p>
                      <p className="text-lg font-semibold">
                        {estimate.chargeableWeightKg} kg
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">
                        Rate per kg
                      </p>
                      <p className="text-lg font-semibold">
                        ${estimate.ratePerKg}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      Estimated Shipping Cost
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      ${estimate.estimatedCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {estimate.chargeableWeightKg} kg ×{" "}
                      ${estimate.ratePerKg}/kg
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    * This is an estimate. Final costs may vary based on actual
                    dimensions, customs fees, and other factors. Contact us for
                    a precise quote.
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
      </div>
    </DashboardLayout>
  );
};

export default ShippingCalculator;
