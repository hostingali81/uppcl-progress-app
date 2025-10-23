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

  // 1. Create new user in Supabase Auth
  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // User doesn't need to confirm email
  });

  if (authError) {
    console.error("Error creating auth user:", authError.message);
    return { error: `Auth Error: ${authError.message}` };
  }

  if (!user) {
    return { error: "Could not create user." };
  }

  // 2. Insert or update user's profile in profiles table
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName,
      role: role,
      value: value,
      updated_at: new Date().toISOString(),
    });
  
  if (profileError) {
    console.error("Error upserting profile:", profileError.message);
    // Here we can delete the created auth user to keep system clean
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { error: `Profile Error: ${profileError.message}` };
  }

  // Refresh user page cache so new list shows
  revalidatePath("/admin/users");

  return { error: null };
}
// src/app/admin/users/actions.ts

// ... (after addUser function)

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