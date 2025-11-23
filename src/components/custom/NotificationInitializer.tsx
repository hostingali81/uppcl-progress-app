'use client';

import { useEffect } from 'react';
import { NotificationService } from '@/lib/notifications/push-notifications';

export function NotificationInitializer() {
    useEffect(() => {
        // Check if running in Capacitor (Android app)
        const isCapacitor = typeof window !== 'undefined' &&
            'Capacitor' in window;

        if (isCapacitor) {
            console.log('🔔 Preparing to initialize notifications...');

            // Delay initialization to ensure Capacitor is fully ready
            const timeoutId = setTimeout(async () => {
                try {
                    console.log('🔔 Initializing notifications...');
                    await NotificationService.initialize();
                    console.log('✅ Notifications initialized successfully');
                } catch (error) {
                    console.error('❌ Failed to initialize notifications:', error);
                    // Don't crash the app - just log the error
                }
            }, 1000); // 1 second delay to ensure app is fully loaded

            return () => clearTimeout(timeoutId);
        } else {
            console.log('ℹ️ Running in browser - notifications disabled');
        }
    }, []);

    return null; // This component doesn't render anything
}
