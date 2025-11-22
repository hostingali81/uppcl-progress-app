// src/components/custom/PWASyncProvider.tsx
'use client';

import { useEffect } from 'react';
import { syncEngine } from '@/lib/sync/engine';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { PendingSyncPanel } from './PendingSyncPanel';

export function PWASyncProvider({ children }: { children: React.ReactNode }) {
    const isOnline = useOnlineStatus();

    useEffect(() => {
        // Start sync engine when online
        if (isOnline) {
            console.log('🌐 Online - Starting sync engine');
            syncEngine.start();
        } else {
            console.log('📴 Offline - Stopping sync engine');
            syncEngine.stop();
        }

        return () => {
            syncEngine.stop();
        };
    }, [isOnline]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">UPPCL Progress Tracker</h2>
                    <OnlineStatusIndicator variant="full" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <PendingSyncPanel />
                {children}
            </div>
        </div>
    );
}
