import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ShippingAddress = {
  id: string;
  country: string;
  countryName: string;
  reference_code: string;
  address: string;
  address_parts: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  instructions: string | null;
  created_at: string;
};

const ShippingAddress = () => {
  const { user } = useAuth();
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShippingAddresses = async () => {
      if (!user) return;

      try {
        const { data: userAddressData, error: userAddressError } = await supabase
          .from('user_shipping_addresses')
          .select('address_id')
          .eq('user_id', user.id);
        
        if (userAddressError) {
          throw userAddressError;
        }
        
        if (userAddressData && userAddressData.length > 0) {
          const addressIds = userAddressData.map(item => item.address_id);
          
          const { data: addressData, error: addressError } = await supabase
            .from('shipping_addresses')
            .select(`
              id, 
              country, 
              reference_code, 
              address, 
              instructions,
              created_at
            `)
            .in('id', addressIds);
            
          if (addressError) {
            throw addressError;
          }

          if (addressData) {
            // Transform and enhance the data
            const enhancedData: ShippingAddress[] = addressData.map(address => {
              // Parse the address to get individual components
              // In a real app, these would be separate fields in the database
              const addressParts = parseAddress(address.address, address.country);
              
              return {
                ...address,
                countryName: getCountryName(address.country),
                address_parts: addressParts,
                phone: getCountryPhone(address.country) // Add default phone based on country
              };
            });
            
            setShippingAddresses(enhancedData);
          }
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

  // Helper function to parse the address string into components
  const parseAddress = (address: string, country: string) => {
    // In a real app, you would parse this properly or have separate fields
    // This is just a placeholder implementation
    const lines = address.split(',');
    return {
      addressLine1: lines[0]?.trim() || '',
      addressLine2: lines[1]?.trim() || '',
      city: lines[2]?.trim() || '',
      state: lines[3]?.trim() || '',
      zipCode: lines[4]?.trim() || ''
    };
  };

  // Helper function to get country name from code
  const getCountryName = (code: string) => {
    const countries = {
      'usa': 'United States',
      'uk': 'United Kingdom',
      'china': 'China',
    };
    return countries[code as keyof typeof countries] || code;
  };

  // Helper function to get default phone based on country
  const getCountryPhone = (code: string) => {
    const phones = {
      'usa': '+1 631 353 7275',
      'uk': '+44 20 7123 4567',
      'china': '+86 21 5812 3456',
    };
    return phones[code as keyof typeof phones] || '+1 (000) 000-0000';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Address has been copied to clipboard",
    });
  };

  const formatAddress = (address: ShippingAddress) => {
    const parts = address.address_parts;
    return `${address.reference_code}\n${parts.addressLine1}\n${parts.addressLine2}\n${parts.city}${
      parts.state ? `, ${parts.state}` : ""
    } ${parts.zipCode}\n${address.countryName}`;
  };

  // Fallback mock data for development
  const mockAddresses: ShippingAddress[] = [
    {
      id: "usa-id",
      country: "usa",
      countryName: "United States",
      reference_code: "Nectarine Full Name",
      address: "17401 Nichols LN Unit J, , Huntington Beach, CA, 92647",
      address_parts: {
        addressLine1: "17401 Nichols LN",
        addressLine2: "Unit J",
        city: "Huntington Beach",
        state: "CA",
        zipCode: "92647"
      },
      phone: "+1 631 353 7275",
      instructions: null,
      created_at: new Date().toISOString()
    },
    {
      id: "uk-id",
      country: "uk",
      countryName: "United Kingdom",
      reference_code: "NECT-UK67890",
      address: "456 Orange Road, Unit 7, London, , SW1A 1AA",
      address_parts: {
        addressLine1: "456 Orange Road",
        addressLine2: "Unit 7",
        city: "London",
        state: "",
        zipCode: "SW1A 1AA"
      },
      phone: "+44 20 7123 4567",
      instructions: null,
      created_at: new Date().toISOString()
    },
    {
      id: "china-id",
      country: "china",
      countryName: "China",
      reference_code: "NECT-CN24680",
      address: "789 Peach Avenue, Building B, Floor 12, Shanghai, , 200000",
      address_parts: {
        addressLine1: "789 Peach Avenue",
        addressLine2: "Building B, Floor 12",
        city: "Shanghai",
        state: "",
        zipCode: "200000"
      },
      phone: "+86 21 5812 3456",
      instructions: null,
      created_at: new Date().toISOString()
    }
  ];

  // Use mock data if no addresses found from the database
  const displayAddresses = shippingAddresses.length > 0 ? shippingAddresses : mockAddresses;

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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nectarine-500"></div>
          </div>
        ) : (
          <Tabs defaultValue={displayAddresses[0]?.country || "usa"} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              {displayAddresses.map((address) => (
                <TabsTrigger key={address.id} value={address.country}>
                  {address.countryName}
                </TabsTrigger>
              ))}
            </TabsList>

            {displayAddresses.map((address) => (
              <TabsContent key={address.id} value={address.country} className="mt-0">
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
                          <span className="font-semibold">{address.reference_code}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Address Line 1:</span>{" "}
                          {address.address_parts.addressLine1}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Address Line 2:</span>{" "}
                          {address.address_parts.addressLine2}
                        </div>
                        <div>
                          <span className="text-muted-foreground">City:</span> {address.address_parts.city}
                        </div>
                        {address.address_parts.state && (
                          <div>
                            <span className="text-muted-foreground">State/Province:</span>{" "}
                            {address.address_parts.state}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Postal/ZIP Code:</span>{" "}
                          {address.address_parts.zipCode}
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
                        <li>Always include your unique reference code: <strong>{address.reference_code}</strong></li>
                        <li>Submit a "Self Purchase Notification" form after ordering to help us identify your package</li>
                        <li>Please forward any tracking information you receive</li>
                        <li>We cannot accept food, liquid, or prohibited items</li>
                        {address.instructions && <li>{address.instructions}</li>}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ShippingAddress;
