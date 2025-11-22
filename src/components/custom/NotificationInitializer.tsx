'use client';

import { useEffect } from 'react';
import { NotificationService } from '@/lib/notifications/push-notifications';

export function NotificationInitializer() {
    useEffect(() => {
        // TEMPORARILY DISABLED - Debugging crash issue
        console.log('⚠️ Notification initialization disabled for debugging');

        // Check if running in Capacitor (Android app)
        // const isCapacitor = typeof window !== 'undefined' && 
        //                    'Capacitor' in window;

        // if (isCapacitor) {
        //   console.log('🔔 Initializing notifications...');
        //   NotificationService.initialize();
        // } else {
        //   console.log('ℹ️ Running in browser - notifications disabled');
        // }
    }, []);

    return null; // This component doesn't render anything
}
