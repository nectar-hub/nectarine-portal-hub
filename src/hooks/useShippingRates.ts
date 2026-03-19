import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ShippingRate {
  id: string;
  country_code: string;
  country_name: string;
  rate_per_kg: number;
  currency_code: string;
  currency_symbol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shipping_rates" as any)
      .select("*")
      .order("country_name");

    if (error) {
      toast({ title: "Error loading shipping rates", description: error.message, variant: "destructive" });
    } else {
      setRates((data as any[]) ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const addRate = async (countryCode: string, countryName: string, ratePerKg: number, currencyCode: string = 'USD', currencySymbol: string = '$') => {
    const { error } = await supabase
      .from("shipping_rates" as any)
      .insert({ country_code: countryCode, country_name: countryName, rate_per_kg: ratePerKg, currency_code: currencyCode, currency_symbol: currencySymbol } as any);
    if (error) {
      toast({ title: "Error adding rate", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Country added successfully" });
    await fetchRates();
    return true;
  };

  const updateRate = async (id: string, updates: Partial<Pick<ShippingRate, "country_code" | "country_name" | "rate_per_kg" | "is_active" | "currency_code" | "currency_symbol">>) => {
    const { error } = await supabase
      .from("shipping_rates" as any)
      .update(updates as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error updating rate", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Rate updated successfully" });
    await fetchRates();
    return true;
  };

  const deleteRate = async (id: string) => {
    const { error } = await supabase
      .from("shipping_rates" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Error deleting rate", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Country removed successfully" });
    await fetchRates();
    return true;
  };

  return { rates, loading, addRate, updateRate, deleteRate, refetch: fetchRates };
}
