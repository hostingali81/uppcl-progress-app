'use client';

import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const CapacitorAppHooks = () => {
    const router = useRouter();
    const lastBackPress = useRef(0);

    useEffect(() => {
        const setupBackButton = async () => {
            try {
                await App.removeAllListeners(); // Ensure clean slate
                await App.addListener('backButton', () => {
                    const now = Date.now();
                    if (now - lastBackPress.current < 500) {
                        return; // Ignore double clicks within 500ms
                    }
                    lastBackPress.current = now;

                    const currentPath = window.location.pathname;
                    console.log('[Back Button] Path:', currentPath);

                    if (currentPath !== '/' && currentPath !== '/login') {
                        router.back();
                    } else {
                        App.exitApp();
                    }
                });
            } catch (error) {
                console.warn('Capacitor App plugin not available:', error);
            }
        };

        setupBackButton();

        return () => {
            App.removeAllListeners();
        };
    }, [router]);

    return null;
};

export default CapacitorAppHooks;
