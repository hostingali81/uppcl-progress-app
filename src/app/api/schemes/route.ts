import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { client: supabase } = await createSupabaseServerClient();
  
  const { data } = await supabase
    .from("works")
    .select("scheme_name")
    .not("scheme_name", "is", null);
  
  const schemes = Array.from(new Set(data?.map((w: { scheme_name: string | null }) => w.scheme_name).filter(Boolean)));
  
  return NextResponse.json({ schemes });
}
