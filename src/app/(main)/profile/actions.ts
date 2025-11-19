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

// Action 3: Mark notification as read
export async function markNotificationAsRead(notificationId: number) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: `Could not mark notification as read: ${error.message}` };
  }

  revalidatePath("/(main)/profile");
  return { success: true };
}

// Action 4: Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { error: `Could not mark all notifications as read: ${error.message}` };
  }

  revalidatePath("/(main)/profile");
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
