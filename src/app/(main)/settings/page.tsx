// src/app/(main)/settings/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Mail } from "lucide-react";

export default async function UserSettingsPage() {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Settings</h1>
                    <p className="text-slate-600">Manage your account preferences and settings</p>
                </div>
            </div>
            
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">Profile Information</CardTitle>
                            <CardDescription className="text-slate-600">
                                This is your profile information.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <h3 className="font-medium text-slate-700 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name
                            </h3>
                            <p className="text-slate-600">{profile?.full_name || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-slate-700 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Address
                            </h3>
                            <p className="text-slate-600">{user.email}</p>
                        </div>
                    </div>
                     <div className="pt-4 border-t border-slate-200">
                        <h3 className="font-medium text-slate-500 mb-2">Future Features</h3>
                        <p className="text-sm text-slate-500">
                           Coming soon: You&apos;ll be able to change your password and customize dashboard columns from here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}