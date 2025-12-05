// src/components/custom/Header.tsx
"use client";

import Link from "next/link";
import { BarChart, LayoutDashboard, LogOut, Menu, Settings, User, Users, FolderOpen, FileText, Bell, X } from "lucide-react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogoutButton } from "./LogoutButton";
import "@/styles/mobile-header.css";

type UserDetails = {
  email: string | undefined;
  role: string;
  fullName: string | undefined;
};

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/analytics", label: "Analytics", icon: BarChart, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/notifications", label: "My Notifications", icon: Bell, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'], showBadge: true },
  { href: "/profile", label: "My Profile", icon: User, roles: ['je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/admin/users", label: "User Management", icon: Users, roles: ['superadmin'] },
  { href: "/admin/settings", label: "System Settings", icon: Settings, roles: ['superadmin'] },
];

const NavLinkMobile = ({ href, label, icon: Icon, onClick, unreadCount, showBadge }: { href: string, label: string, icon: React.ElementType, onClick: () => void, unreadCount?: number, showBadge?: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href} onClick={onClick} className={cn("flex items-center justify-between space-x-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200", isActive ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent")}>
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      {showBadge && unreadCount !== undefined && unreadCount > 0 && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Link>
  );
};

export function Header({ userDetails }: { userDetails: UserDetails }) {
  const [isOpen, setIsOpen] = useState(false);
  const [schemes, setSchemes] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const navItems = allNavItems.filter(item => item.roles.includes(userDetails.role));

  useEffect(() => {
    fetch('/api/schemes').then(r => r.json()).then(data => setSchemes(data.schemes || []));
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.notifications) {
          const count = data.notifications.filter((n: any) => !n.is_read).length;
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds for updates
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Scroll detection for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6 transition-shadow duration-300",
        isScrolled ? "mobile-header-scrolled" : "shadow-sm"
      )}
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
    >
      {/* Mobile Layout - only visible on mobile */}
      <div className="flex md:hidden items-center gap-4 flex-1">
        {/* Hamburger Menu - Left Side */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <EnhancedButton
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 h-10 w-10 transition-all duration-200"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isOpen ? (
                <X className="h-6 w-6 text-slate-700 mobile-header-icon-close" />
              ) : (
                <Menu className="h-6 w-6 text-slate-700 mobile-header-icon-menu" />
              )}
            </EnhancedButton>
          </SheetTrigger>

          {/* Pragati Logo - Center-Left */}
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-wide ml-1">
            Pragati
          </Link>

          <SheetContent side="left" className="flex flex-col w-80 bg-white border-r border-slate-200 z-[60]">
            <SheetHeader className="border-b border-slate-200 px-6 py-4 bg-slate-50" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
              <SheetTitle className="text-left">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-wide" onClick={() => setIsOpen(false)}>Pragati Menu</Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto bg-white">
              <nav className="grid gap-1 p-4">
                {navItems.map((item) => (
                  <NavLinkMobile
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    onClick={() => setIsOpen(false)}
                    unreadCount={unreadCount}
                    showBadge={item.showBadge}
                  />
                ))}
                {schemes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                      <FolderOpen className="h-4 w-4" />
                      Schemes
                    </div>
                    {schemes.map((scheme) => (
                      <Link
                        key={scheme}
                        href={`/schemes/${encodeURIComponent(scheme)}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      >
                        <span className="truncate">{scheme}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </nav>
            </div>
            <SheetFooter className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="w-full">
                <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-800">{userDetails.fullName}</p>
                  <p className="text-xs text-slate-500 capitalize">{userDetails.role.replace('_', ' ')}</p>
                </div>
                <LogoutButton
                  variant="outline"
                  className="w-full border-slate-200 hover:bg-slate-50 bg-white"
                  onClick={() => setIsOpen(false)}
                >
                  Log Out
                </LogoutButton>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Notification Bell - Right Side (Mobile) */}
      <Link href="/notifications" className="md:hidden relative flex items-center justify-center p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
        <Bell className="h-6 w-6 text-slate-700" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold text-white bg-red-600 rounded-full shadow-lg mobile-header-badge"
            style={{
              border: '2px solid white',
              zIndex: 9999,
              transform: 'translate(25%, -25%)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* Desktop - no content needed */}
      <div className="hidden md:block"></div>
    </header>
  );
}
