"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)} // Mobile touch support
      onTouchEnd={() => setTimeout(() => setIsVisible(false), 2000)} // Auto hide after 2 seconds on mobile
      onClick={(e) => e.preventDefault()} // Prevent click events from bubbling
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-[200] px-4 py-3 text-sm text-white bg-slate-900 rounded-lg shadow-xl",
          "max-w-[320px] w-max", // Better width handling
          "break-words whitespace-normal", // Proper multiline support
          "text-left leading-relaxed", // Better text formatting
          "bottom-full left-1/2 transform -translate-x-1/2 mb-3",
          "before:content-[''] before:absolute before:top-full before:left-1/2 before:transform before:-translate-x-1/2",
          "before:border-4 before:border-transparent before:border-t-slate-900",
          // Mobile-specific improvements
          "sm:max-w-[400px]",
          // Ensure tooltip doesn't go off screen
          "max-h-[300px] overflow-y-auto",
          // Better mobile positioning
          "left-1/2 -translate-x-1/2",
          // Mobile touch-friendly
          "touch-manipulation",
          className
        )}>
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
      )}
    </div>
  );
}
