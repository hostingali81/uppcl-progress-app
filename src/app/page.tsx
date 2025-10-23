// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // --- This line was added ---
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowRight, GanttChartSquare, Shield, BarChart3, Users, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // Check if user is already logged in
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    return redirect("/dashboard");
  }

  // If not logged in, show landing page
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 px-4 sm:px-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          <GanttChartSquare className="h-6 w-6 sm:h-7 sm:w-7" />
          <span className="hidden sm:inline">Pragati Platform</span>
          <span className="sm:hidden">Pragati</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 text-sm sm:text-base px-3 sm:px-4">
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="text-center px-4 py-8 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 sm:mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-sm px-3 py-1">
              Project Management, Simple & Effective
            </Badge>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Manage Your Departmental Works
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1 sm:mt-2">
                In One Place
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              With Pragati Platform, get complete transparency and real-time data from ground-level updates to top-level analytics.
            </p>
            <div className="mt-6 sm:mt-10">
              <Link href="/login">
                <Button size="lg" className="group bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-8 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8 sm:mb-12">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <div className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Analytics Dashboard</h3>
                <p className="text-sm sm:text-base text-slate-600">Real-time insights and comprehensive reporting</p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Progress Tracking</h3>
                <p className="text-sm sm:text-base text-slate-600">Monitor work progress with detailed updates</p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">User Management</h3>
                <p className="text-sm sm:text-base text-slate-600">Role-based access and user administration</p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Secure Platform</h3>
                <p className="text-sm sm:text-base text-slate-600">Enterprise-grade security and data protection</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-4 sm:py-6 px-4 sm:px-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <p className="text-center text-xs sm:text-sm text-slate-500">
          © {new Date().getFullYear()} Pragati Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}