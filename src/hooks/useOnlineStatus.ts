// src/hooks/useOnlineStatus.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * Returns true when online, false when offline
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        function handleOnline() {
            setIsOnline(true);
            console.log('🌐 Network: Online');
        }

        function handleOffline() {
            setIsOnline(false);
            console.log('📴 Network: Offline');
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial status
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
