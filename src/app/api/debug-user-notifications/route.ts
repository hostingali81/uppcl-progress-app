// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userName = searchParams.get("userName");

        const { admin: supabaseAdmin } = await createSupabaseServerClient();

        // Find user by name
        const { data: user, error: userError } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, role, region, circle, division, subdivision")
            .ilike("full_name", userName || "YOGI")
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found", details: userError }, { status: 404 });
        }

        // Fetch notifications for this user
        const { data: notifications, error: notifError } = await supabaseAdmin
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (notifError) {
            return NextResponse.json({ error: "Failed to fetch notifications", details: notifError }, { status: 500 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                full_name: user.full_name,
                role: user.role,
                region: user.region,
                circle: user.circle,
                division: user.division,
                subdivision: user.subdivision
            },
            notification_count: notifications?.length || 0,
            notifications: notifications || []
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
