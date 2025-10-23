// src/components/custom/LogoutButton.tsx
"use client";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  onClick?: () => void;
}

export function LogoutButton({ 
  variant = "outline", 
  className = "", 
  children,
  showIcon = true,
  onClick
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      onClick?.(); // Call the onClick prop if provided
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh(); // Refresh to clear any cached data
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect to login
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {isLoading ? "Logging out..." : (children || "Log Out")}
    </Button>
  );
}