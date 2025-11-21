// src/app/(main)/profile/page.tsx
// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileClient } from "@/components/custom/ProfileClient";
import { ProfileError, ProfileNotFound } from "@/components/custom/ProfileErrorStates";
import { User, Mail, Shield, Calendar, MapPin } from "lucide-react";
import type { Database } from "@/types/supabase";

type ProfileData = Database['public']['Tables']['profiles']['Row'];

export default async function ProfilePage() {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    let profile: ProfileData | null = null;
    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, region, division, subdivision, updated_at")
        .eq("id", user.id)
        .single();

    if (profileData) {
        profile = profileData;
    }

    console.log("User ID:", user.id);
    console.log("Profile data:", profile);
    console.log("Profile error:", profileError);

    // Additional check: see if any profile exists for this user
    const { data: profileCheck, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    console.log("Profile check result:", profileCheck);
    console.log("Profile check error:", checkError);

    if (profileError) {
        console.error("Profile fetch error details:", profileError);
        console.error("Error type:", typeof profileError);
        console.error("Error keys:", Object.keys(profileError));

        // Check if error is empty object or has no meaningful properties
        const isEmptyError = !profileError || (typeof profileError === 'object' && Object.keys(profileError).length === 0);
        const hasNoContent = !profileError.code && !profileError.message && !profileError.details;

        if (profileError.code === 'PGRST116' ||
            profileError.message?.includes('No rows found') ||
            isEmptyError || hasNoContent) {
            console.log("Profile not found, proceeding to create profile logic");
            // Don't return here, let the code fall through to profile creation logic
        } else {
            console.error("Error code:", profileError.code);
            console.error("Error message:", profileError.message);
            return <ProfileError userEmail={user.email} userId={user.id} errorMessage={profileError.message || 'Unknown error occurred'} />;
        }
    }

    // Don't fetch notifications server-side to avoid hydration issues
    // Let NotificationsSection handle client-side fetching

    if (!profile) {
        // Try to create a basic profile if it doesn't exist
        console.log("Profile not found, attempting to create basic profile...");

        const profileInsert = {
            id: user.id,
            full_name: user.email?.split('@')[0] || 'User',
            role: 'je', // Default role
        };

        const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert(profileInsert)
            .select()
            .single();

        if (createError || !newProfile) {
            console.error("Failed to create profile:", createError);
            return <ProfileNotFound userEmail={user.email} userId={user.id} />;
        }

        // Use the newly created profile
        profile = newProfile as ProfileData;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-600">Manage your account settings and personal information</p>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-white to-slate-50">
                <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                        </div>
                        Profile Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm font-medium">Email</span>
                            </div>
                            <p className="text-slate-900 font-medium">{user.email}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Shield className="h-4 w-4" />
                                <span className="text-sm font-medium">Role</span>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {profile?.role?.replace('_', ' ') || 'Not assigned'}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm font-medium">Assignment</span>
                            </div>
                            <p className="text-slate-900 font-medium">{profile?.region || 'N/A'}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-medium">Member Since</span>
                            </div>
                            <p className="text-slate-900 font-medium">
                                N/A
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Edit Profile Card */}
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900">Personal Information</CardTitle>
                                <CardDescription className="text-slate-600">
                                    Update your name and personal details
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Current Name:</p>
                                <p className="text-slate-900 font-medium">{profile?.full_name || 'Not set'}</p>
                            </div>
                            <ProfileClient
                                fullName={profile?.full_name || ''}
                                type="profile"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Shield className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900">Security</CardTitle>
                                <CardDescription className="text-slate-600">
                                    Change your password for better security
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Password Status:</p>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                </Badge>
                            </div>
                            <ProfileClient
                                fullName=""
                                type="password"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
