// src/components/custom/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient();
                const { data: { session }, error } = await supabase.auth.getSession();

                console.log('🔐 Auth check:', {
                    hasSession: !!session,
                    error: error?.message,
                    pathname
                });

                if (error || !session) {
                    console.log('❌ No valid session, redirecting to login');
                    router.replace('/login');
                    return;
                }

                console.log('✅ Valid session found');
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check error:', error);
                router.replace('/login');
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();

        // Listen for auth state changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event, !!session);

            if (event === 'SIGNED_OUT' || !session) {
                router.replace('/login');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setIsAuthenticated(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
