import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useShippingRates } from "@/hooks/useShippingRates";
import { ShippingCalculatorForm } from "@/components/shipping/ShippingCalculatorForm";
import { ShippingRatesManager } from "@/components/shipping/ShippingRatesManager";

const ShippingCalculator = () => {
  const { isAdmin } = useAuth();
  const { rates, loading, addRate, updateRate, deleteRate } = useShippingRates();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Shipping Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Estimate your delivery cost by entering the package size, weight, and origin country.
          </p>
        </div>

        <ShippingCalculatorForm rates={rates} loading={loading} />

        {isAdmin && (
          <ShippingRatesManager
            rates={rates}
            loading={loading}
            onAdd={addRate}
            onUpdate={updateRate}
            onDelete={deleteRate}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ShippingCalculator;
