
import { supabase } from "@/integrations/supabase/client";
import { BuyRequestFormValues, BuyRequestItem } from "@/types/buyRequest";

export async function createBuyRequest(values: BuyRequestFormValues, userId: string) {
  let screenshotUrl = null;
  
  // Handle file upload if there's a screenshot
  if (values.screenshot && values.screenshot.length > 0) {
    try {
      const file = values.screenshot[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId}/buy-requests/${fileName}`;
      
      // Upload the file to Supabase Storage (bucket already exists with proper policies)
      const { data, error } = await supabase.storage
        .from("buy-request-screenshots")
        .upload(filePath, file);
      
      if (error) throw error;
      
      if (data) {
        // Get public URL for the uploaded file
        const { data: urlData } = supabase
          .storage
          .from("buy-request-screenshots")
          .getPublicUrl(filePath);
          
        screenshotUrl = urlData.publicUrl;
      }
    } catch (error) {
      console.error("Screenshot upload failed:", error);
      // Continue with the request even if screenshot upload fails
    }
  }

  
  // Step 1: Insert the buy request into the database for the first item
  const firstItem = values.items[0];
  
  // Store color and size information in the notes field if they exist
  let notesWithDetails = values.notes || "";
  if (firstItem.color || firstItem.size) {
    notesWithDetails += `\n\nItem Details:\n`;
    if (firstItem.color) notesWithDetails += `Color: ${firstItem.color}\n`;
    if (firstItem.size) notesWithDetails += `Size: ${firstItem.size}\n`;
  }
  
  const buyRequestData = {
    user_id: userId,
    product_name: firstItem.productName,
    product_url: firstItem.productUrl,
    quantity: parseInt(firstItem.quantity),
    product_price: firstItem.productPrice ? parseFloat(firstItem.productPrice) : null,
    screenshot_url: screenshotUrl,
    notes: notesWithDetails,
    country_of_purchase: values.country || "Default", // Use country from form values or default
    store_name: firstItem.storeName || "Not specified", // Add store name if available
    color: firstItem.color || null,
    size: firstItem.size || null
  };
  
  
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
  
  
  // Create an order for this request
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
  
  
  // Now insert additional items if there are more than one item
  if (values.items.length > 1) {
    
    // For additional items, create buy_request_items entries linked to the main buy_request
    const additionalItems = values.items.slice(1);
    const itemsToInsert = additionalItems.map(item => ({
      buy_request_id: createdBuyRequest.id,
      product_name: item.productName,
      product_url: item.productUrl,
      quantity: parseInt(item.quantity),
      price: item.productPrice ? parseFloat(item.productPrice) : null,
      store_name: item.storeName || "Not specified",
      color: item.color || null,
      size: item.size || null
    }));
    
    
    const { error: additionalItemsError } = await supabase
      .from("buy_request_items")
      .insert(itemsToInsert);
    
    if (additionalItemsError) {
      console.error("[BUY SERVICE] Error adding additional items:", additionalItemsError);
      // Log but don't throw - the main request was created successfully
    } else {
    }
  }
  
  return createdOrder.id;
}

export async function updateBuyRequest(
  buyRequestId: string,
  values: BuyRequestFormValues,
  userId: string
) {
  let screenshotUrl = null;
  
  // Handle file upload if there's a new screenshot
  if (values.screenshot && values.screenshot.length > 0) {
    try {
      const file = values.screenshot[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId}/buy-requests/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from("buy-request-screenshots")
        .upload(filePath, file);
      
      if (error) throw error;
      
      if (data) {
        const { data: urlData } = supabase
          .storage
          .from("buy-request-screenshots")
          .getPublicUrl(filePath);
          
        screenshotUrl = urlData.publicUrl;
      }
    } catch (error) {
      console.error("Screenshot upload failed:", error);
    }
  }

  
  const firstItem = values.items[0];
  
  let notesWithDetails = values.notes || "";
  if (firstItem.color || firstItem.size) {
    notesWithDetails += `\n\nItem Details:\n`;
    if (firstItem.color) notesWithDetails += `Color: ${firstItem.color}\n`;
    if (firstItem.size) notesWithDetails += `Size: ${firstItem.size}\n`;
  }
  
  const updateData: any = {
    product_name: firstItem.productName,
    product_url: firstItem.productUrl,
    quantity: parseInt(firstItem.quantity),
    product_price: firstItem.productPrice ? parseFloat(firstItem.productPrice) : null,
    notes: notesWithDetails,
    country_of_purchase: values.country || "Default",
    store_name: firstItem.storeName || "Not specified",
    color: firstItem.color || null,
    size: firstItem.size || null
  };
  
  if (screenshotUrl) {
    updateData.screenshot_url = screenshotUrl;
  }
  
  const { error: updateError } = await supabase
    .from("buy_requests")
    .update(updateData)
    .eq('id', buyRequestId)
    .eq('user_id', userId);

  if (updateError) {
    console.error("[BUY SERVICE] Buy request update error:", updateError);
    throw new Error(`Update error: ${updateError.message || "Unknown error occurred"}`);
  }
  
  // Delete all existing additional items
  await supabase
    .from("buy_request_items")
    .delete()
    .eq('buy_request_id', buyRequestId);
  
  // Insert new additional items if there are more than one item
  if (values.items.length > 1) {
    const additionalItems = values.items.slice(1);
    const itemsToInsert = additionalItems.map(item => ({
      buy_request_id: buyRequestId,
      product_name: item.productName,
      product_url: item.productUrl,
      quantity: parseInt(item.quantity),
      price: item.productPrice ? parseFloat(item.productPrice) : null,
      store_name: item.storeName || "Not specified",
      color: item.color || null,
      size: item.size || null
    }));
    
    const { error: itemsError } = await supabase
      .from("buy_request_items")
      .insert(itemsToInsert);
    
    if (itemsError) {
      console.error("[BUY SERVICE] Error updating items:", itemsError);
    }
  }
  
}
