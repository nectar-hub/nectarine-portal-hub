import { supabase } from "@/integrations/supabase/client";

export interface SelfPurchaseFormValues {
  product_type: string;
  store_name: string;
  quantity: number;
  estimated_value?: number;
  tracking_number: string;
  courier: string;
  notes?: string;
}

export async function createSelfPurchase(
  values: SelfPurchaseFormValues,
  userId: string
) {
  console.log("[SELF PURCHASE SERVICE] Creating self purchase");
  
  // Insert the self purchase first  
  const { data: createdSelfPurchase, error } = await supabase
    .from('self_purchases')
    .insert({
      user_id: userId,
      product_type: values.product_type,
      description: values.product_type,
      store_name: values.store_name,
      quantity: values.quantity,
      estimated_value: values.estimated_value,
      tracking_number: values.tracking_number,
      courier: values.courier,
      notes: values.notes,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Create an order for this self purchase
  if (createdSelfPurchase?.id) {
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        reference_id: createdSelfPurchase.id,
        user_id: userId,
        order_type: 'self_purchase'
      });

    if (orderError) {
      console.warn('Failed to create order for self purchase:', orderError);
    }
  }

  console.log("[SELF PURCHASE SERVICE] Self purchase created successfully");
  return createdSelfPurchase.id;
}

export async function updateSelfPurchase(
  purchaseId: string,
  values: SelfPurchaseFormValues,
  userId: string
) {
  console.log("[SELF PURCHASE SERVICE] Updating self purchase:", purchaseId);
  
  const { error } = await supabase
    .from('self_purchases')
    .update({
      product_type: values.product_type,
      description: values.product_type,
      store_name: values.store_name,
      quantity: values.quantity,
      estimated_value: values.estimated_value,
      tracking_number: values.tracking_number,
      courier: values.courier,
      notes: values.notes,
    })
    .eq('id', purchaseId)
    .eq('user_id', userId);

  if (error) {
    console.error("[SELF PURCHASE SERVICE] Update error:", error);
    throw new Error(`Update error: ${error.message || "Unknown error occurred"}`);
  }
  
  console.log("[SELF PURCHASE SERVICE] Self purchase updated successfully");
}
