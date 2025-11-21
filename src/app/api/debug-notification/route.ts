import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Helper function for case-insensitive string comparison
function areStringsEqual(str1: string | null | undefined, str2: string | null | undefined): boolean {
    if (!str1 || !str2) return false;
    return str1.trim().toLowerCase() === str2.trim().toLowerCase();
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const workId = searchParams.get("workId");

        if (!workId) {
            return NextResponse.json({ error: "workId is required" }, { status: 400 });
        }

        const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();

        // Fetch work details
        const { data: work, error: workError } = await supabaseAdmin
            .from("works")
            .select("*")
            .eq("id", workId)
            .single();

        if (workError || !work) {
            return NextResponse.json({ error: "Work not found", details: workError }, { status: 404 });
        }

        // Fetch all users
        const { data: allUsers, error: usersError } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, role, region, circle, division, subdivision");

        if (usersError) {
            return NextResponse.json({ error: "Failed to fetch users", details: usersError }, { status: 500 });
        }

        const results = allUsers.map((user: any) => {
            const { id, full_name, role, region, circle, division, subdivision } = user;
            let shouldNotify = false;
            let reason = "";
            let comparison = {};

            switch (role) {
                case 'superadmin':
                case 'admin':
                    shouldNotify = true;
                    reason = "Is Admin";
                    break;
                case 'je':
                    comparison = { user_region: region, work_je_name: work.je_name };
                    shouldNotify = areStringsEqual(region, work.je_name);
                    reason = shouldNotify ? "JE region matches work je_name" : "JE region does not match";
                    break;
                case 'sub_division_head':
                    comparison = { user_subdivision: subdivision, work_subdivision: work.civil_sub_division };
                    shouldNotify = areStringsEqual(subdivision, work.civil_sub_division);
                    reason = shouldNotify ? "SDO subdivision matches" : "SDO subdivision does not match";
                    break;
                case 'division_head':
                    comparison = { user_division: division, work_division: work.civil_division };
                    shouldNotify = areStringsEqual(division, work.civil_division);
                    reason = shouldNotify ? "EE division matches" : "EE division does not match";
                    break;
                case 'circle_head':
                    comparison = { user_circle: circle, work_circle: work.civil_circle };
                    shouldNotify = areStringsEqual(circle, work.civil_circle);
                    reason = shouldNotify ? "SE circle matches" : "SE circle does not match";
                    break;
                case 'zone_head':
                    comparison = { user_region: region, work_zone: work.civil_zone };
                    shouldNotify = areStringsEqual(region, work.civil_zone);
                    reason = shouldNotify ? "CE zone matches" : "CE zone does not match";
                    break;
                default:
                    reason = "Role not matched";
            }

            return {
                user: { id, full_name, role },
                shouldNotify,
                reason,
                comparison
            };
        });

        return NextResponse.json({
            work: {
                id: work.id,
                work_name: work.work_name,
                je_name: work.je_name,
                civil_sub_division: work.civil_sub_division,
                civil_division: work.civil_division,
                civil_circle: work.civil_circle,
                civil_zone: work.civil_zone
            },
            results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
