// src/app/(main)/profile/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// एक्शन 1: यूज़र का नाम अपडेट करना
export async function updateUserProfile(formData: FormData) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const fullName = formData.get("fullName") as string;
  if (!fullName) {
    return { error: "Name cannot be empty." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    return { error: `Could not update profile: ${error.message}` };
  }

  revalidatePath("/(main)/profile", "layout"); // लेआउट को रीवैलिडेट करें ताकि साइडबार में नया नाम दिखे
  return { success: "Profile updated successfully!" };
}

// एक्शन 2: यूज़र का पासवर्ड बदलना
export async function updateUserPassword(formData: FormData) {
  const { client: supabase } = await createSupabaseServerClient();
  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: `Could not update password: ${error.message}` };
  }

  return { success: "Password updated successfully!" };
}