// src/components/custom/OnlineStatusIndicator.tsx
'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnlineStatusIndicatorProps {
    variant?: 'badge' | 'icon' | 'full';
    className?: string;
}

export function OnlineStatusIndicator({
    variant = 'badge',
    className
}: OnlineStatusIndicatorProps) {
    const isOnline = useOnlineStatus();

    if (variant === 'icon') {
        return (
            <div className={cn('flex items-center', className)}>
                {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                )}
            </div>
        );
    }

    if (variant === 'full') {
        return (
            <div className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                isOnline
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200',
                className
            )}>
                {isOnline ? (
                    <>
                        <Cloud className="h-4 w-4" />
                        <span>Online - Syncing enabled</span>
                    </>
                ) : (
                    <>
                        <CloudOff className="h-4 w-4" />
                        <span>Offline - Working locally</span>
                    </>
                )}
            </div>
        );
    }

    // Default badge variant
    return (
        <Badge
            variant={isOnline ? 'default' : 'destructive'}
            className={cn('flex items-center gap-1', className)}
        >
            {isOnline ? (
                <>
                    <Wifi className="h-3 w-3" />
                    <span>Online</span>
                </>
            ) : (
                <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                </>
            )}
        </Badge>
    );
}
