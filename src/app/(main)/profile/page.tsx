// src/app/(main)/profile/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateProfileForm } from "@/components/custom/UpdateProfileForm";
import { UpdatePasswordForm } from "@/components/custom/UpdatePasswordForm";

export default async function ProfilePage() {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, value")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return <p className="p-8 text-red-500">Could not load profile.</p>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold">मेरी प्रोफाइल</h1>
            
            {/* प्रोफाइल विवरण कार्ड */}
            <Card>
                <CardHeader>
                    <CardTitle>प्रोफाइल विवरण</CardTitle>
                    <CardDescription>
                        यह जानकारी केवल आप और सिस्टम एडमिन देख सकते हैं।
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <UpdateProfileForm fullName={profile.full_name || ''} />
                </CardContent>
            </Card>

            {/* पासवर्ड बदलें कार्ड */}
            <Card>
                <CardHeader>
                    <CardTitle>पासवर्ड बदलें</CardTitle>
                    <CardDescription>
                        सुरक्षा कारणों से समय-समय पर अपना पासवर्ड बदलते रहें।
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UpdatePasswordForm />
                </CardContent>
            </Card>

            {/* केवल-पढ़ने योग्य जानकारी */}
             <Card className="border-yellow-500">
                <CardHeader>
                    <CardTitle>सिस्टम जानकारी (केवल-पढ़ने योग्य)</CardTitle>
                    <CardDescription>
                       यह जानकारी सिस्टम एडमिन द्वारा प्रबंधित की जाती है।
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h3 className="font-medium text-sm text-gray-500">ईमेल</h3>
                        <p>{user.email}</p>
                    </div>
                     <div>
                        <h3 className="font-medium text-sm text-gray-500">आपकी भूमिका (Role)</h3>
                        <p className="capitalize">{profile.role.replace('_', ' ')}</p>
                    </div>
                     <div>
                        <h3 className="font-medium text-sm text-gray-500">आपका मान (Value)</h3>
                        <p>{profile.value || 'N/A'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}