// @ts-nocheck
// src/app/page.tsx
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowRight, GanttChartSquare, Shield, BarChart3, Users, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import "../styles/homepage-animations.css";

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
    <div className="flex flex-col min-h-screen animated-gradient-bg particle-bg overflow-hidden">
      {/* Glassmorphic Header */}
      <header className="flex items-center justify-between p-4 px-4 sm:px-6 glass-effect-strong sticky top-0 z-50 border-b border-white/20">
        <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold bounce-in">
          <div className="icon-pulse">
            <GanttChartSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-lg" />
          </div>
          <span className="hidden sm:inline text-white drop-shadow-lg">Pragati Platform</span>
          <span className="sm:hidden text-white drop-shadow-lg">Pragati</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 fade-in-up">
          <Link href="/login">
            <EnhancedButton
              variant="outline"
              size="sm"
              className="btn-shine glass-effect border-white/30 text-white hover:bg-white/20 text-sm sm:text-base px-3 sm:px-4 font-semibold backdrop-blur-md"
            >
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </EnhancedButton>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="text-center px-4 py-12 sm:py-20 md:py-28 relative">
          <div className="max-w-5xl mx-auto relative z-10">
            {/* Animated Badge */}
            <div className="mb-6 sm:mb-8 fade-in-up inline-block">
              <Badge
                variant="secondary"
                className="badge-shimmer text-white border-white/30 bg-white/20 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-semibold"
              >
                <Sparkles className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Project Management, Simple & Effective
              </Badge>
            </div>

            {/* Animated Hero Title */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-4 fade-in-up stagger-1 drop-shadow-2xl">
              Manage Your Departmental Works
              <span className="block animated-text-gradient mt-2 sm:mt-4 text-4xl sm:text-6xl md:text-8xl">
                In One Place
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 sm:mt-8 text-base sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed fade-in-up stagger-2 drop-shadow-lg font-medium">
              With Pragati Platform, get complete transparency and real-time data from ground-level updates to top-level analytics.
            </p>

            {/* CTA Button */}
            <div className="mt-8 sm:mt-12 fade-in-up stagger-3 float-animation">
              <Link href="/login">
                <EnhancedButton
                  size="lg"
                  className="group btn-shine bg-white text-purple-600 hover:bg-white/90 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-2" />
                </EnhancedButton>
              </Link>
            </div>
          </div>

          {/* Decorative Gradient Orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-20 px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center text-white mb-12 sm:mb-16 fade-in-up drop-shadow-lg">
              Powerful Features
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Feature Card 1 */}
              <div className="card-hover-effect glass-effect-strong text-center p-6 sm:p-8 rounded-2xl border border-white/20 fade-in-up stagger-1">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg icon-rotate-hover transform transition-transform">
                  <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 drop-shadow">
                  Analytics Dashboard
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  Real-time insights and comprehensive reporting for better decisions
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="card-hover-effect glass-effect-strong text-center p-6 sm:p-8 rounded-2xl border border-white/20 fade-in-up stagger-2">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg icon-rotate-hover transform transition-transform">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 drop-shadow">
                  Progress Tracking
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  Monitor work progress with detailed, real-time updates
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="card-hover-effect glass-effect-strong text-center p-6 sm:p-8 rounded-2xl border border-white/20 fade-in-up stagger-3">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg icon-rotate-hover transform transition-transform">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 drop-shadow">
                  User Management
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  Role-based access and comprehensive user administration
                </p>
              </div>

              {/* Feature Card 4 */}
              <div className="card-hover-effect glass-effect-strong text-center p-6 sm:p-8 rounded-2xl border border-white/20 fade-in-up stagger-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg icon-rotate-hover transform transition-transform">
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 drop-shadow">
                  Secure Platform
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  Enterprise-grade security with advanced data protection
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-16 px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="glass-effect-strong rounded-3xl p-8 sm:p-12 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center">
                <div className="fade-in-up stagger-1">
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 animated-text-gradient">
                    100%
                  </div>
                  <div className="text-base sm:text-lg text-white/80 font-medium">
                    Transparency
                  </div>
                </div>
                <div className="fade-in-up stagger-2">
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 animated-text-gradient">
                    Real-time
                  </div>
                  <div className="text-base sm:text-lg text-white/80 font-medium">
                    Updates
                  </div>
                </div>
                <div className="fade-in-up stagger-3">
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 animated-text-gradient">
                    24/7
                  </div>
                  <div className="text-base sm:text-lg text-white/80 font-medium">
                    Monitoring
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Glassmorphic Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 glass-effect border-t border-white/20 mt-12">
        <p className="text-center text-sm sm:text-base text-white/80 font-medium drop-shadow">
          © {new Date().getFullYear()} Pragati Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}