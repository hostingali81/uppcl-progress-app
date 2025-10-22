// src/app/actions.ts
"use server";

// --- यहाँ बदलाव किया गया है ---
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const { client: supabase } = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return redirect("/login");
}