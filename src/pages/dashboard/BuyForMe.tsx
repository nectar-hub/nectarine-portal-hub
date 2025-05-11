
import DashboardLayout from "@/layouts/DashboardLayout";
import { BuyRequestForm } from "@/components/forms/BuyRequestForm";

const BuyForMe = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buy For Me Request</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the form below to request us to purchase items for you. You can add multiple items to a single order.
          </p>
        </div>

        <BuyRequestForm />
      </div>
    </DashboardLayout>
  );
};

export default BuyForMe;
