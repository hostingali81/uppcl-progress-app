import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { admin: supabaseAdmin } = await createSupabaseServerClient();

    // Check authentication
    const { data: { user } } = await supabaseAdmin.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch all progress logs ordered by creation time
    const { data: progressLogs, error } = await supabaseAdmin
      .from("progress_logs")
      .select("id, work_id, new_progress, created_at")
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching progress logs:", error);
      return NextResponse.json({ error: "Failed to fetch progress logs" }, { status: 500 });
    }

    return NextResponse.json(progressLogs || []);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
