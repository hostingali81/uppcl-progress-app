// src/app/admin/users/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addUser(formData: FormData) {
  const { admin: supabaseAdmin } = await createSupabaseServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;
  const value = formData.get("value") as string;

  // 1. Supabase Auth में नया यूज़र बनाना
  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // यूज़र को ईमेल कन्फर्म करने की ज़रूरत नहीं है
  });

  if (authError) {
    console.error("Error creating auth user:", authError.message);
    return { error: `Auth Error: ${authError.message}` };
  }

  if (!user) {
    return { error: "Could not create user." };
  }

  // 2. profiles टेबल में यूज़र की प्रोफाइल अपडेट करना
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName,
      role: role,
      value: value,
    })
    .eq("id", user.id);
  
  if (profileError) {
    console.error("Error updating profile:", profileError.message);
    // यहाँ हम बने हुए auth यूज़र को डिलीट कर सकते हैं ताकि सिस्टम साफ रहे
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { error: `Profile Error: ${profileError.message}` };
  }

  // यूज़र पेज के कैश को रीफ्रेश करें ताकि नई लिस्ट दिखे
  revalidatePath("/admin/users");

  return { error: null };
}
// src/app/admin/users/actions.ts

// ... (addUser फंक्शन के बाद)

export async function updateUser(formData: FormData) {
  const { admin: supabaseAdmin } = await createSupabaseServerClient();

  const id = formData.get("id") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;
  const value = formData.get("value") as string;

  if (!id) {
    return { error: "User ID is missing." };
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName,
      role: role,
      value: value,
    })
    .eq("id", id);

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
    return { error: `Profile Error: ${profileError.message}` };
  }

  revalidatePath("/admin/users");
  return { error: null };
}