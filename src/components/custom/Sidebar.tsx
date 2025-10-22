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
  { href: "/dashboard", label: "डैशबोर्ड", icon: LayoutDashboard, roles: ['superadmin', 'je', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/analytics", label: "एनालिटिक्स", icon: BarChart, roles: ['superadmin', 'je', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/admin/users", label: "यूज़र मैनेजमेंट", icon: Users, roles: ['superadmin'] },
  { href: "/admin/settings", label: "सिस्टम सेटिंग्स", icon: Settings, roles: ['superadmin'] },
  // --- यहाँ बदलाव किया गया है ---
  { href: "/profile", label: "मेरी प्रोफाइल", icon: User, roles: ['je', 'division_head', 'circle_head', 'zone_head', 'user'] },
];

const NavLink = ({ item }: { item: typeof allNavItems[0] }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);
  return (
    <Link href={item.href} className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium", isActive ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>
      <item.icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
};

export function Sidebar({ userDetails }: { userDetails: UserDetails }) {
  const navItems = allNavItems.filter(item => item.roles.includes(userDetails.role));

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="text-xl font-bold text-blue-600">प्रगति</Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">{navItems.map((item) => <NavLink key={item.href} item={item} />)}</nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left h-auto py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800 truncate">{userDetails.fullName}</span>
                  <span className="text-xs text-gray-500 capitalize">{userDetails.role.replace('_', ' ')}</span>
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
            {/* --- यहाँ बदलाव किया गया है --- */}
            {userDetails.role !== 'superadmin' && (
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>मेरी प्रोफाइल</span>
                </DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => await signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>लॉग आउट</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}