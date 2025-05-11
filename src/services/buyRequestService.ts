
import { supabase } from "@/integrations/supabase/client";
import { BuyRequestFormValues, BuyRequestItem } from "@/types/buyRequest";

export async function createBuyRequest(values: BuyRequestFormValues, userId: string) {
  let screenshotUrl = null;
  
  // Handle file upload if there's a screenshot
  if (values.screenshot && values.screenshot.length > 0) {
    const file = values.screenshot[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${userId}/buy-requests/${fileName}`;
    
    // TODO: Upload the file to Supabase Storage once it's set up
    // const { data, error } = await supabase.storage
    //   .from("buy-request-screenshots")
    //   .upload(filePath, file);
    
    // if (error) throw error;
    // screenshotUrl = data?.path;
  }

  console.log("[BUY SERVICE] Starting submission process with user_id:", userId);
  
  // Step 1: Insert the buy request into the database for the first item
  const firstItem = values.items[0];
  
  const buyRequestData = {
    user_id: userId,
    product_name: firstItem.productName,
    product_url: firstItem.productUrl,
    quantity: parseInt(firstItem.quantity),
    product_price: firstItem.productPrice ? parseFloat(firstItem.productPrice) : null,
    store_name: values.storeName,
    delivery_deadline: values.deliveryDeadline.toISOString(),
    screenshot_url: screenshotUrl,
    notes: values.notes,
    country_of_purchase: values.country,
    // We'll store color and size in notes if they exist
    additional_details: JSON.stringify({
      color: firstItem.color || null,
      size: firstItem.size || null
    })
  };
  
  console.log("[BUY SERVICE] Submitting buy request with data:", buyRequestData);
  
  // First create the buy request
  const { data: createdBuyRequest, error: buyRequestError } = await supabase
    .from("buy_requests")
    .insert(buyRequestData)
    .select()
    .single();

  if (buyRequestError) {
    console.error("[BUY SERVICE] Buy request error:", buyRequestError);
    throw new Error(`Buy request error: ${buyRequestError.message || "Unknown error occurred"}`);
  }
  
  if (!createdBuyRequest || !createdBuyRequest.id) {
    throw new Error("Failed to create buy request - no ID returned");
  }
  
  console.log("[BUY SERVICE] Buy request created successfully:", createdBuyRequest);
  
  // Create an order for the first item
  const orderPayload = {
    reference_id: createdBuyRequest.id,
    user_id: userId,
    order_type: 'buy_request'
  };
  
  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("id")
    .single();
  
  if (orderError) {
    console.error("[BUY SERVICE] Order creation error:", orderError);
    throw new Error(`Order creation error: ${orderError.message || "Unknown error occurred"}`);
  }
  
  console.log("[BUY SERVICE] Main order created successfully with ID:", createdOrder?.id);
  
  // Now insert additional items if there are more than one item
  if (values.items.length > 1) {
    // For additional items, create separate buy requests linked to the same order
    const additionalItems = values.items.slice(1);
    for (const item of additionalItems) {
      const additionalItemData = {
        user_id: userId,
        product_name: item.productName,
        product_url: item.productUrl,
        quantity: parseInt(item.quantity),
        product_price: item.productPrice ? parseFloat(item.productPrice) : null,
        store_name: values.storeName,
        delivery_deadline: values.deliveryDeadline.toISOString(),
        country_of_purchase: values.country,
        notes: values.notes,
        parent_order_id: createdOrder.id, // Link to the main order
        additional_details: JSON.stringify({
          color: item.color || null,
          size: item.size || null
        })
      };
      
      console.log("[BUY SERVICE] Adding additional item:", additionalItemData);
      
      const { error: additionalItemError } = await supabase
        .from("buy_requests")
        .insert(additionalItemData);
      
      if (additionalItemError) {
        console.error("[BUY SERVICE] Error adding additional item:", additionalItemError);
        // We won't throw here, just log the error to not disrupt the main flow
      }
    }
  }
  
  return createdOrder.id;
}
