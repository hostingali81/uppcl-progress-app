// src/components/custom/Header.tsx
"use client";

import Link from "next/link";
import { BarChart, LayoutDashboard, LogOut, Menu, Settings, User, Users, FolderOpen, FileText } from "lucide-react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogoutButton } from "./LogoutButton";

type UserDetails = {
  email: string | undefined;
  role: string;
  fullName: string | undefined;
};

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/analytics", label: "Analytics", icon: BarChart, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ['superadmin', 'je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/profile", label: "My Profile", icon: User, roles: ['je', 'sub_division_head', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/admin/users", label: "User Management", icon: Users, roles: ['superadmin'] },
  { href: "/admin/settings", label: "System Settings", icon: Settings, roles: ['superadmin'] },
];

const NavLinkMobile = ({ href, label, icon: Icon, onClick }: { href: string, label: string, icon: React.ElementType, onClick: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href} onClick={onClick} className={cn("flex items-center space-x-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200", isActive ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent")}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export function Header({ userDetails }: { userDetails: UserDetails }) {
  const [isOpen, setIsOpen] = useState(false);
  const [schemes, setSchemes] = useState<string[]>([]);
  const navItems = allNavItems.filter(item => item.roles.includes(userDetails.role));

  useEffect(() => {
    fetch('/api/schemes').then(r => r.json()).then(data => setSchemes(data.schemes || []));
  }, []);


  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm">
      {/* Logo - only visible on mobile */}
      <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent md:hidden">Pragati</Link>
      
      {/* Mobile hamburger menu - only visible on mobile */}
      <div className="flex md:hidden mobile-menu-trigger">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <EnhancedButton 
              variant="outline" 
              size="icon" 
              className="border-slate-200 hover:bg-slate-50 h-10 w-10"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </EnhancedButton>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col w-80 bg-white border-l border-slate-200 z-[60]">
            <SheetHeader className="border-b border-slate-200 px-6 py-4 bg-slate-50">
              <SheetTitle className="text-left">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" onClick={() => setIsOpen(false)}>Pragati Menu</Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto bg-white">
              <nav className="grid gap-1 p-4">
                {navItems.map((item) => (
                  <NavLinkMobile key={item.href} href={item.href} label={item.label} icon={item.icon} onClick={() => setIsOpen(false)} />
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
      
      {/* Desktop - no content needed */}
      <div className="hidden md:block"></div>
    </header>
  );
}