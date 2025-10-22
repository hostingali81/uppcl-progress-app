// src/app/(main)/settings/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">मेरी सेटिंग्स</h1>
            <Card>
                <CardHeader>
                    <CardTitle>प्रोफाइल जानकारी</CardTitle>
                    <CardDescription>
                        यह आपकी प्रोफाइल जानकारी है।
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-medium">पूरा नाम</h3>
                        <p className="text-gray-600">{profile?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium">ईमेल</h3>
                        <p className="text-gray-600">{user.email}</p>
                    </div>
                     <div className="pt-4">
                        <h3 className="font-medium text-gray-500">भविष्य की सुविधाएँ</h3>
                        <p className="text-sm text-gray-500">
                           जल्द ही आप यहाँ से अपना पासवर्ड बदल सकेंगे और डैशबोर्ड के लिए कॉलम चुन सकेंगे।
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}