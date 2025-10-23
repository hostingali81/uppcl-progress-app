// src/components/ui/enhanced-button.tsx
"use client";

import * as React from "react";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  asChild?: boolean;
}

export function EnhancedButton({
  loading = false,
  loadingText = "Loading...",
  children,
  className,
  disabled,
  onClick,
  ...props
}: EnhancedButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isClicked, setIsClicked] = React.useState(false);
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    // Set clicked state briefly for visual feedback
    setIsClicked(true);
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    // Call the original onClick
    onClick?.(e);
    
    // Reset clicked state quickly (just for visual feedback)
    setTimeout(() => {
      setIsClicked(false);
    }, 150); // Reduced from 2000ms to 150ms
  };

  const handleMouseDown = () => {
    if (!loading && !disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        "enhanced-button relative overflow-hidden",
        isPressed && "scale-95 shadow-inner",
        loading && "button-loading cursor-wait",
        isClicked && "button-clicked",
        className
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          {/* Ripple effects */}
          {ripples.map(ripple => (
            <span
              key={ripple.id}
              className="ripple-effect"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20,
              }}
            />
          ))}
        </>
      )}
    </Button>
  );
}
