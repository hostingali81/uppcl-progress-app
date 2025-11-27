// @ts-nocheck
// src/app/api/push-token/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { client: supabase } = await createSupabaseServerClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the push token from the request body
        const body = await request.json();
        const { token } = body;

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 400 }
            );
        }

        // Update the user's profile with the push token
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                push_token: token,
                push_token_updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to save push token:', updateError);
            return NextResponse.json(
                { error: "Failed to save token" },
                { status: 500 }
            );
        }

        console.log(`✅ Push token saved for user ${user.id}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in push-token API:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
