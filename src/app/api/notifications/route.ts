// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, message = "Test notification", work_id = 1 } = body;

    if (action === 'debug') {
      // Create a test notification
      const { data: testNotification, error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: user.id,
          work_id: work_id,
          type: 'comment',
          message: message,
          is_read: false,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating test notification:", insertError);
        return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
      }

      return NextResponse.json({ success: true, created_id: testNotification.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.log("Fetching notifications for user:", user.id);

    // Debug: Check if notifications exist for this user
    const { data: debugNotifications, error: debugError } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    console.log("DEBUG - Admin fetched notifications:", debugNotifications);
    console.log("DEBUG - User ID:", user.id);

    // Fetch notifications for the user
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, message, is_read, created_at, work_id, comment_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    console.log("User fetched notifications:", notifications);

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications", details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      debug: {
        user_id: user.id,
        admin_count: debugNotifications?.length || 0,
        client_count: notifications?.length || 0
      },
      success: true
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
