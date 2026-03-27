
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ShippingAddressData = {
  id: string;
  country: string;
  label: string | null;
  reference_code: string;
  address: string;
  instructions: string | null;
  created_at: string;
};

const ShippingAddress = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ShippingAddressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShippingAddresses = async () => {
      if (!user) return;

      try {
        const { data: userAddressData, error: userAddressError } = await supabase
          .from('user_shipping_addresses')
          .select('address_id')
          .eq('user_id', user.id);

        if (userAddressError) throw userAddressError;

        if (userAddressData && userAddressData.length > 0) {
          const addressIds = userAddressData.map(item => item.address_id);

          const { data: addressData, error: addressError } = await supabase
            .from('shipping_addresses')
            .select('id, country, label, reference_code, address, instructions, created_at')
            .in('id', addressIds)
            .order('sort_order')
            .order('country');

          if (addressError) throw addressError;
          if (addressData) setAddresses(addressData);
        }
      } catch (error) {
        console.error('Error fetching shipping addresses:', error);
        toast({
          title: "Error",
          description: "Failed to load shipping addresses",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShippingAddresses();
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Address has been copied to clipboard",
    });
  };

  const formatCopyText = (addr: ShippingAddressData) => {
    return `${addr.reference_code}\n${addr.address}\n${addr.country}`;
  };

  const getCountryLabel = (country: string) => {
    const map: Record<string, string> = {
      usa: "United States", uk: "United Kingdom", china: "China",
      uae: "UAE", tanzania: "Tanzania",
    };
    return map[country.toLowerCase()] || country;
  };

  const getDisplayLabel = (addr: ShippingAddressData) => {
    return addr.label || getCountryLabel(addr.country);
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

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Shipping Addresses Assigned</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                You don't have any shipping addresses assigned yet. Please contact support to get your warehouse addresses set up.
              </p>
            </CardContent>
          </Card>
        ) : (() => {
          // Group addresses by country
          const grouped = addresses.reduce<Record<string, ShippingAddressData[]>>((acc, addr) => {
            const key = addr.country.toLowerCase();
            if (!acc[key]) acc[key] = [];
            acc[key].push(addr);
            return acc;
          }, {});

          const countryKeys = Object.keys(grouped);

          return (
            <Tabs defaultValue={countryKeys[0]} className="w-full">
              <TabsList className="grid mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(countryKeys.length, 4)}, 1fr)` }}>
                {countryKeys.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {getCountryLabel(key)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {countryKeys.map((key) => {
                const countryAddresses = grouped[key];
                return (
                  <TabsContent key={key} value={key} className="mt-0">
                    {countryAddresses.length === 1 ? (
                      <AddressCard addr={countryAddresses[0]} copyToClipboard={copyToClipboard} formatCopyText={formatCopyText} getCountryLabel={getCountryLabel} getDisplayLabel={getDisplayLabel} />
                    ) : (
                      <Tabs defaultValue={countryAddresses[0].id} className="w-full">
                        <TabsList className="grid mb-4" style={{ gridTemplateColumns: `repeat(${countryAddresses.length}, 1fr)` }}>
                          {countryAddresses.map((addr) => (
                            <TabsTrigger key={addr.id} value={addr.id}>
                              {addr.label || 'Address'}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {countryAddresses.map((addr) => (
                          <TabsContent key={addr.id} value={addr.id} className="mt-0">
                            <AddressCard addr={addr} copyToClipboard={copyToClipboard} formatCopyText={formatCopyText} getCountryLabel={getCountryLabel} getDisplayLabel={getDisplayLabel} />
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          );
        })()}
      </div>
    </DashboardLayout>
  );
};

// Extracted address card component
const AddressCard = ({ addr, copyToClipboard, formatCopyText, getCountryLabel, getDisplayLabel }: {
  addr: ShippingAddressData;
  copyToClipboard: (text: string) => void;
  formatCopyText: (addr: ShippingAddressData) => string;
  getCountryLabel: (country: string) => string;
  getDisplayLabel: (addr: ShippingAddressData) => string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>{getDisplayLabel(addr)} Shipping Address</span>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => copyToClipboard(formatCopyText(addr))}
        >
          <Copy className="h-4 w-4" />
          <span>Copy</span>
        </Button>
      </CardTitle>
      <CardDescription>
        Use this address when shopping online — {getDisplayLabel(addr)}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
        <div className="grid gap-2">
          <div>
            <span className="text-muted-foreground">Reference:</span>{" "}
            <span className="font-semibold">{addr.reference_code}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Address:</span>{" "}
            <span className="whitespace-pre-line">{addr.address}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Country:</span>{" "}
            {getCountryLabel(addr.country)}
          </div>
        </div>
      </div>

      {addr.instructions && (
        <div className="mt-6 bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold mb-2">Important Instructions</h4>
          <p className="whitespace-pre-line">{addr.instructions}</p>
        </div>
      )}

      <div className="mt-4 bg-muted/50 p-4 rounded-md border">
        <h4 className="font-semibold mb-2">General Guidelines</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>Always include your unique reference code: <strong className="text-foreground">{addr.reference_code}</strong></li>
          <li>Submit a "Self Purchase Notification" form after ordering to help us identify your package</li>
          <li>Please forward any tracking information you receive</li>
          <li>We cannot accept food, liquid, or prohibited items</li>
        </ul>
      </div>
    </CardContent>
  </Card>
);

export default ShippingAddress;
