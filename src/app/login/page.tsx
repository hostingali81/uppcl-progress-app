// src/app/login/page.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { LogIn, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/types/supabase";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const supabase = createSupabaseClient();
      const resp = await supabase.auth.signInWithPassword({ email, password });
      console.debug('signInWithPassword response:', resp);
      const { error } = resp;

      if (error) {
        // Show Supabase-provided message when available for easier debugging
        const message = error.message || 'Invalid email or password. Please try again.';
        toast.error(message);
        setIsLoading(false);
        return;
      }

      // After login, fetch user and profile role to route appropriately
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      let destination = "/dashboard";
      if (signedInUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", signedInUser.id)
          .single<Database['public']['Tables']['profiles']['Row']>();
        if (profile?.role === "superadmin") {
          destination = "/admin";
        }
      }
      toast.success("Login successful! Redirecting...");
      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            DVVNL Prgati
          </h1>
          <p className="text-slate-600 mt-2">Project Management and Tracker</p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-600">
              Please sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-11 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-11 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <EnhancedButton
                type="submit"
                disabled={isLoading}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${isLoading ? 'btn-loading' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </EnhancedButton>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Secure project management and tracking system
          </p>
        </div>
      </div>
    </div>
  );
}