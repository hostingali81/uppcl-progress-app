// src/app/actions.ts
"use server";

// --- Changes made here ---
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const { client: supabase } = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return redirect("/login");
}