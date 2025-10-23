// src/components/custom/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart, LayoutDashboard, LogOut, Settings, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions";

type UserDetails = {
  email: string | undefined;
  role: string;
  fullName: string | undefined;
};

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/analytics", label: "Analytics", icon: BarChart, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/admin/users", label: "User Management", icon: Users, roles: ['superadmin'] },
  { href: "/admin/settings", label: "System Settings", icon: Settings, roles: ['superadmin'] },
  { href: "/profile", label: "My Profile", icon: User, roles: ['je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
];

const NavLink = ({ item }: { item: typeof allNavItems[0] }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);
  return (
    <Link href={item.href} className={cn("flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? "bg-blue-100 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
      <item.icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
};

export function Sidebar({ userDetails }: { userDetails: UserDetails }) {
  const navItems = allNavItems.filter(item => item.roles.includes(userDetails.role));

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Pragati</Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-slate-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left h-auto py-2 hover:bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800 truncate">{userDetails.fullName}</span>
                  <span className="text-xs text-slate-500 capitalize">{userDetails.role.replace('_', ' ')}</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userDetails.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userDetails.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* --- Updated here --- */}
            {userDetails.role !== 'superadmin' && (
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => await signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}