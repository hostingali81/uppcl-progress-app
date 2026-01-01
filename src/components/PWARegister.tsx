'use client';

import { useEffect } from 'react';

export default function PWARegister() {
    useEffect(() => {
        console.log('PWARegister: Checking for SW support');
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator
        ) {
            console.log('PWARegister: SW supported, registering /sw.js');
            // Register the service worker
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                    console.log('SW scope:', registration.scope);
                    console.log('SW state:', registration.active?.state);
                })
                .catch((error) => {
                    console.log('SW registration failed: ', error);
                });
        } else {
            console.log('PWARegister: SW not supported or not in browser');
        }
    }, []);

    return null;
}
