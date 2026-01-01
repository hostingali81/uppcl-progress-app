// src/components/custom/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart,
  LayoutDashboard,
  Settings,
  User,
  Users,
  FolderOpen,
  FileText,
  Bell,
  ChevronDown,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";
import "@/styles/sidebar-animations.css";

type UserDetails = {
  email: string | undefined;
  role: string;
  fullName: string | undefined;
};

const allNavItems = [
  { href: "/dashboard", label: "Progress Dashboard", icon: LayoutDashboard, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/analytics", label: "Analytics", icon: BarChart, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/admin/users", label: "User Management", icon: Users, roles: ['superadmin'] },
  { href: "/admin/settings", label: "System Settings", icon: Settings, roles: ['superadmin'] },
  { href: "/notifications", label: "My Notifications", icon: Bell, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/profile", label: "My Profile", icon: User, roles: ['je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
];

const NavLink = ({ item, badge, darkMode }: { item: typeof allNavItems[0], badge?: React.ReactNode, darkMode: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all-smooth elevation-hover relative",
        isActive
          ? darkMode
            ? "bg-gradient-to-r from-blue-950/50 to-indigo-950/50 text-white font-semibold border-l-4 border-blue-500 shadow-lg shadow-blue-500/20 sidebar-slide-in"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 font-semibold border-l-4 border-blue-500 shadow-sm sidebar-slide-in"
          : darkMode
            ? "text-slate-400 hover:bg-slate-800/50 hover:text-white hover:shadow-md"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 transition-all-smooth icon-hover",
          isActive
            ? darkMode ? "text-blue-400" : "text-blue-600"
            : darkMode ? "text-slate-500 group-hover:text-blue-400" : "text-slate-500 group-hover:text-blue-600"
        )}
      />
      <span className="flex-1">{item.label}</span>
      {badge}
    </Link>
  );
};

export function Sidebar({ userDetails }: { userDetails: UserDetails }) {
  const navItems = allNavItems.filter(item => item.roles.includes(userDetails.role));
  const [schemes, setSchemes] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [schemesExpanded, setSchemesExpanded] = useState(true);

  useEffect(() => {
    setIsClient(true);
    fetch('/api/schemes').then(r => r.json()).then(data => setSchemes(data.schemes || []));

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (data.notifications) {
          const count = data.notifications.filter((n: any) => !n.is_read).length;
          setUnreadCount(count);
        }
      } catch (error) {
        console.warn("Could not fetch unread notifications count");
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  if (!isClient) {
    // SSR version
    return (
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-slate-200 bg-white shadow-sm sticky top-0 h-screen">
        <div className="flex h-20 items-center justify-center border-b border-slate-200 px-6">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
            DVVNL Prgati
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1.5 mt-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-600 hover:bg-slate-100">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:w-64 border-r shadow-lg sticky top-0 h-screen transition-colors-smooth",
        darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-200"
      )}
    >
      {/* Branding Area */}
      <div className={cn(
        "flex h-20 items-center justify-center border-b px-6 shadow-sm",
        darkMode ? "border-slate-800" : "border-slate-200"
      )}>
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight hover:scale-105 transition-transform"
        >
          DVVNL Prgati
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <nav className="p-4 space-y-1.5 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              darkMode={darkMode}
              badge={item.href === '/notifications' && unreadCount > 0 ? (
                <div className="relative">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full badge-pulse badge-bounce",
                      darkMode
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/50"
                        : "bg-red-500 text-white shadow-md shadow-red-500/30"
                    )}
                    title="Unread Notifications"
                  >
                    {unreadCount}
                  </span>
                </div>
              ) : null}
            />
          ))}

          {/* Schemes Section */}
          {isClient && schemes.length > 0 && (
            <div className={cn(
              "mt-6 pt-4 border-t transition-colors-smooth",
              darkMode ? "border-slate-800" : "border-slate-200"
            )}>
              <button
                onClick={() => setSchemesExpanded(!schemesExpanded)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all-smooth rounded-lg",
                  darkMode
                    ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="flex-1 text-left">Schemes</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    schemesExpanded && "rotate-180"
                  )}
                />
              </button>

              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                schemesExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
              )}>
                <div className="space-y-0.5">
                  {schemes.map((scheme) => (
                    <Link
                      key={scheme}
                      href={`/schemes/${encodeURIComponent(scheme)}`}
                      className={cn(
                        "flex items-center pl-9 pr-3 py-2 text-sm font-medium rounded-lg transition-all-smooth elevation-hover",
                        darkMode
                          ? "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <span className="truncate">{scheme}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Dark Mode Toggle & Profile Section */}
      <div className={cn(
        "mt-auto border-t transition-colors-smooth",
        darkMode ? "border-slate-800" : "border-slate-200"
      )}>
        {/* Dark Mode Toggle */}
        <div className="px-4 py-3">
          <button
            onClick={toggleDarkMode}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all-smooth elevation-hover text-sm font-medium",
              darkMode
                ? "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-4 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-auto py-2.5 transition-all-smooth",
                  darkMode
                    ? "hover:bg-slate-800/50 text-white"
                    : "hover:bg-slate-50 text-slate-900"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center ring-2 ring-offset-2 ring-blue-500/20">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      darkMode ? "text-white" : "text-slate-900"
                    )}>
                      {userDetails.fullName}
                    </span>
                    <span className={cn(
                      "text-xs capitalize truncate",
                      darkMode ? "text-slate-400" : "text-slate-500"
                    )}>
                      {userDetails.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn(
                "w-56",
                darkMode && "bg-slate-800 border-slate-700"
              )}
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className={cn(
                    "text-sm font-medium leading-none",
                    darkMode && "text-white"
                  )}>
                    {userDetails.fullName}
                  </p>
                  <p className={cn(
                    "text-xs leading-none",
                    darkMode ? "text-slate-400" : "text-muted-foreground"
                  )}>
                    {userDetails.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={darkMode ? "bg-slate-700" : ""} />
              {userDetails.role !== 'superadmin' && (
                <Link href="/profile">
                  <DropdownMenuItem className={darkMode ? "text-slate-300 hover:bg-slate-700" : ""}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuSeparator className={darkMode ? "bg-slate-700" : ""} />
              <LogoutButton variant="ghost" className="w-full justify-start" showIcon={true}>
                Log Out
              </LogoutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#64748b' : '#94a3b8'};
        }
      `}</style>
    </aside>
  );
}
