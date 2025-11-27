// src/app/(main)/layout-client.tsx
'use client';

import { Header } from "@/components/custom/Header";
import { Sidebar } from "@/components/custom/Sidebar";
import { ErrorBoundary } from "@/components/custom/ErrorBoundary";
import { NotificationInitializer } from '@/components/custom/NotificationInitializer';
import { PullToRefresh } from '@/components/custom/PullToRefresh';
import { AuthGuard } from '@/components/custom/AuthGuard';
import type { UserDetails } from '@/types/profile';

export function MainLayoutClient({
    children,
    userDetails
}: {
    children: React.ReactNode;
    userDetails: UserDetails;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
                <NotificationInitializer />
                <Sidebar userDetails={userDetails} />
                <div className="flex flex-1 flex-col min-w-0">
                    <Header userDetails={userDetails} />
                    <PullToRefresh>
                        <main className="min-h-full p-4 md:p-6">
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </main>
                    </PullToRefresh>
                </div>
            </div>
        </AuthGuard>
    );
}
