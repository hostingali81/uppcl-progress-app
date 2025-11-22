"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
    children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter();
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [pulling, setPulling] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Threshold to trigger refresh (in pixels)
    const PULL_THRESHOLD = 120;
    // Maximum pull distance visually
    const MAX_PULL = 180;

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Only enable if we are at the top of the scroll container
            const scrollContainer = contentRef.current;
            if (scrollContainer && scrollContainer.scrollTop === 0) {
                setStartY(e.touches[0].clientY);
                setPulling(true);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!pulling || refreshing) return;

            const scrollContainer = contentRef.current;
            if (scrollContainer && scrollContainer.scrollTop > 0) {
                setPulling(false);
                return;
            }

            const y = e.touches[0].clientY;
            const diff = y - startY;

            // Only allow pulling down
            if (diff > 0) {
                // Add resistance
                const newY = Math.min(diff * 0.5, MAX_PULL);
                setCurrentY(newY);

                // Prevent default to stop native scroll bouncing if we are pulling
                if (e.cancelable && diff < PULL_THRESHOLD) {
                    // e.preventDefault(); // Careful with this, might block scrolling
                }
            }
        };

        const handleTouchEnd = () => {
            if (!pulling || refreshing) return;

            if (currentY >= PULL_THRESHOLD * 0.5) { // Trigger earlier for better feel
                handleRefresh();
            } else {
                // Reset
                setCurrentY(0);
            }
            setPulling(false);
        };

        const container = contentRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('touchmove', handleTouchMove, { passive: false });
            container.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [startY, pulling, refreshing, currentY]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setCurrentY(PULL_THRESHOLD - 40); // Snap to loading position

        try {
            // Haptic feedback if available
            if (typeof window !== 'undefined' && 'Capacitor' in window) {
                try {
                    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
                    await Haptics.impact({ style: ImpactStyle.Medium });
                } catch (e) {
                    // Ignore if haptics fail
                }
            }

            // Refresh data
            router.refresh();

            // Wait a bit to show the animation (min 1 sec)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Also reload window to ensure full refresh if needed, but router.refresh is usually enough for Next.js
            // window.location.reload(); 
        } finally {
            setRefreshing(false);
            setCurrentY(0);
        }
    };

    return (
        <div className="relative flex flex-col flex-1 overflow-hidden">
            {/* Refresh Indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-10"
                style={{
                    height: `${currentY}px`,
                    transition: pulling ? 'none' : 'height 0.3s ease-out, opacity 0.3s'
                }}
            >
                <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 transition-transform duration-200",
                    refreshing ? "opacity-100 scale-100" : (currentY > 20 ? "opacity-100 scale-100" : "opacity-0 scale-50")
                )}>
                    {refreshing ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                        <RefreshCw
                            className="h-5 w-5 text-blue-600"
                            style={{ transform: `rotate(${currentY * 2}deg)` }}
                        />
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                ref={contentRef}
                className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-blue-50/50"
                style={{
                    transform: `translateY(${refreshing ? 0 : currentY * 0.3}px)`, // Parallax effect
                    transition: pulling ? 'none' : 'transform 0.3s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
}
