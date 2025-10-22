// src/components/custom/Header.tsx
"use client";

import Link from "next/link";
import { BarChart, LayoutDashboard, LogOut, Menu, Settings, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "@/app/actions";

type UserDetails = {
  email: string | undefined;
  role: string;
  fullName: string | undefined;
};

const allNavItems = [
  { href: "/dashboard", label: "डैशबोर्ड", icon: LayoutDashboard, roles: ['superadmin', 'je', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/analytics", label: "एनालिटिक्स", icon: BarChart, roles: ['superadmin', 'je', 'division_head', 'circle_head', 'zone_head', 'user'] },
  // --- यहाँ बदलाव किया गया है ---
  { href: "/profile", label: "मेरी प्रोफाइल", icon: User, roles: ['je', 'division_head', 'circle_head', 'zone_head', 'user'] },
  { href: "/admin/users", label: "यूज़र मैनेजमेंट", icon: Users, roles: ['superadmin'] },
  { href: "/admin/settings", label: "सिस्टम सेटिंग्स", icon: Settings, roles: ['superadmin'] },
];

const NavLinkMobile = ({ href, label, icon: Icon, onClick }: { href: string, label: string, icon: React.ElementType, onClick: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href} onClick={onClick} className={cn("flex items-center space-x-4 rounded-lg px-4 py-3 text-base font-medium", isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50")}>
      <Icon className="h-6 w-6" />
      <span>{label}</span>
    </Link>
  );
};

export function Header({ userDetails }: { userDetails: UserDetails }) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = allNavItems.filter(item => item.roles.includes(userDetails.role));

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
      <Link href="/" className="text-lg font-bold text-blue-600">प्रगति</Link>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon"><Menu className="h-6 w-6" /><span className="sr-only">Toggle navigation menu</span></Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader className="border-b px-4 pb-4">
            <SheetTitle>
              <Link href="/" className="text-lg font-bold text-blue-600" onClick={() => setIsOpen(false)}>प्रगति मेनू</Link>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid gap-2 p-4">{navItems.map((item) => <NavLinkMobile key={item.href} href={item.href} label={item.label} icon={item.icon} onClick={() => setIsOpen(false)} />)}</nav>
          </div>
          <SheetFooter className="p-4 border-t">
             <div className="w-full">
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-800">{userDetails.fullName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userDetails.role.replace('_', ' ')}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={async () => { setIsOpen(false); await signOut(); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    लॉग आउट
                </Button>
             </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  );
}