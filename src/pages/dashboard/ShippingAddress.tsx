
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data for shipping addresses
const shippingAddresses = [
  {
    country: "usa",
    countryName: "United States",
    reference: "NECT-US12345",
    addressLine1: "123 Nectarine Street",
    addressLine2: "Suite 101",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    phone: "+1 (212) 555-6789",
  },
  {
    country: "uk",
    countryName: "United Kingdom",
    reference: "NECT-UK67890",
    addressLine1: "456 Orange Road",
    addressLine2: "Unit 7",
    city: "London",
    state: "",
    zipCode: "SW1A 1AA",
    phone: "+44 20 7123 4567",
  },
  {
    country: "china",
    countryName: "China",
    reference: "NECT-CN24680",
    addressLine1: "789 Peach Avenue",
    addressLine2: "Building B, Floor 12",
    city: "Shanghai",
    state: "",
    zipCode: "200000",
    phone: "+86 21 5812 3456",
  },
];

const ShippingAddress = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Address has been copied to clipboard",
    });
  };

  const formatAddress = (address: typeof shippingAddresses[0]) => {
    return `${address.reference}\n${address.addressLine1}\n${address.addressLine2}\n${address.city}${
      address.state ? `, ${address.state}` : ""
    } ${address.zipCode}\n${address.countryName}\n${address.phone}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Shipping Address</h1>
          <p className="text-muted-foreground mt-1">
            Use these addresses when shopping online. We'll assist in shipping your purchases to your
            final destination.
          </p>
        </div>

        <Tabs defaultValue="usa" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="usa">USA</TabsTrigger>
            <TabsTrigger value="uk">UK</TabsTrigger>
            <TabsTrigger value="china">China</TabsTrigger>
          </TabsList>

          {shippingAddresses.map((address) => (
            <TabsContent key={address.country} value={address.country} className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{address.countryName} Shipping Address</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => copyToClipboard(formatAddress(address))}
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Use this address when shopping online in {address.countryName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    <div className="grid gap-2">
                      <div>
                        <span className="text-muted-foreground">Reference:</span>{" "}
                        <span className="font-semibold">{address.reference}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address Line 1:</span>{" "}
                        {address.addressLine1}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address Line 2:</span>{" "}
                        {address.addressLine2}
                      </div>
                      <div>
                        <span className="text-muted-foreground">City:</span> {address.city}
                      </div>
                      {address.state && (
                        <div>
                          <span className="text-muted-foreground">State/Province:</span>{" "}
                          {address.state}
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Postal/ZIP Code:</span>{" "}
                        {address.zipCode}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Country:</span> {address.countryName}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {address.phone}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
                    <h4 className="font-semibold mb-2">Important Instructions</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Always include your unique reference code: <strong>{address.reference}</strong></li>
                      <li>Submit a "Self Purchase Notification" form after ordering to help us identify your package</li>
                      <li>Please forward any tracking information you receive</li>
                      <li>We cannot accept food, liquid, or prohibited items</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ShippingAddress;
