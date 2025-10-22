// src/app/login/page.tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function Login() {
  const signIn = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { client: supabase } = await createSupabaseServerClient(); // await का उपयोग करें

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">प्रगति - लॉगिन</CardTitle>
          <CardDescription>कृपया जारी रखने के लिए अपने खाते में लॉग इन करें।</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
            {/* ... (फॉर्म का बाकी हिस्सा अपरिवर्तित) ... */}
             <div className="space-y-2">
              <Label htmlFor="email">ईमेल</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">लॉग इन करें</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}