// src/app/(main)/profile/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Action 1: Update user's name
export async function updateProfile(fullName: string) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

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

  revalidatePath("/(main)/profile", "layout");
  return { success: true };
}

// Action 2: Change user's password with current password validation
export async function updatePassword(currentPassword: string, newPassword: string) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!currentPassword) {
    return { error: "Current password is required." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters long." };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect." };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: `Could not update password: ${error.message}` };
  }

  return { success: true };
}