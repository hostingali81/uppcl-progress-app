// src/components/custom/PendingSyncPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Upload,
    FileText,
    MessageSquare,
    Briefcase,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { syncEngine } from '@/lib/sync/engine';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

export function PendingSyncPanel() {
    const isOnline = useOnlineStatus();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const pendingItems = useLiveQuery(
        () => db.syncQueue
            .where('status')
            .anyOf(['pending', 'processing', 'failed'])
            .toArray()
    );

    const pendingUploads = useLiveQuery(
        () => db.attachments
            .where('syncStatus')
            .anyOf(['pending', 'uploading'])
            .toArray()
    );

    const handleManualSync = async () => {
        if (!isOnline) return;

        setIsSyncing(true);
        try {
            await syncEngine.processSyncQueue();
        } finally {
            setIsSyncing(false);
        }
    };

    const totalPending = (pendingItems?.length || 0) + (pendingUploads?.length || 0);

    if (totalPending === 0) {
        return null;
    }

    const getEntityIcon = (entity: string) => {
        switch (entity) {
            case 'work':
                return <Briefcase className="h-4 w-4" />;
            case 'progress_log':
                return <FileText className="h-4 w-4" />;
            case 'comment':
                return <MessageSquare className="h-4 w-4" />;
            case 'attachment':
                return <ImageIcon className="h-4 w-4" />;
            default:
                return <Upload className="h-4 w-4" />;
        }
    };

    return (
        <Card className="border-blue-200 bg-blue-50 mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Sync ({totalPending})
                        </CardTitle>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-6 w-6 p-0"
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleManualSync}
                        disabled={!isOnline || isSyncing}
                        className="bg-white"
                    >
                        {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Sync Now</span>
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-2">
                    {/* Sync Queue Items */}
                    {pendingItems?.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm shadow-sm"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    {item.status === 'processing' && (
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    )}
                                    {item.status === 'pending' && getEntityIcon(item.entity)}
                                    {item.status === 'failed' && (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium capitalize">{item.operation}</span>
                                        <span className="text-gray-500 capitalize">{item.entity.replace('_', ' ')}</span>
                                    </div>
                                    {item.error && (
                                        <p className="text-xs text-red-600 truncate mt-1">{item.error}</p>
                                    )}
                                    {item.attempts > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Attempt {item.attempts}/{item.maxAttempts}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Badge
                                variant={
                                    item.status === 'processing'
                                        ? 'default'
                                        : item.status === 'failed'
                                            ? 'destructive'
                                            : 'secondary'
                                }
                                className="ml-2 flex-shrink-0"
                            >
                                {item.status}
                            </Badge>
                        </div>
                    ))}

                    {/* Upload Items */}
                    {pendingUploads?.map((upload) => (
                        <div
                            key={upload.id}
                            className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm shadow-sm"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    {upload.syncStatus === 'uploading' ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    ) : (
                                        <ImageIcon className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium">{upload.file_name}</p>
                                    {upload.syncStatus === 'uploading' && (
                                        <Progress value={upload.uploadProgress} className="h-1 mt-2" />
                                    )}
                                    {upload.syncError && (
                                        <p className="text-xs text-red-600 truncate mt-1">{upload.syncError}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                {upload.syncStatus === 'uploading' && (
                                    <span className="text-xs text-gray-500 font-medium">
                                        {upload.uploadProgress}%
                                    </span>
                                )}
                                <Badge
                                    variant={
                                        upload.syncStatus === 'uploading' ? 'default' : 'secondary'
                                    }
                                >
                                    {upload.syncStatus}
                                </Badge>
                            </div>
                        </div>
                    ))}

                    {/* Offline Warning */}
                    {!isOnline && (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800 flex items-start gap-2">
                            <WifiOff className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p>
                                You're offline. Items will sync automatically when you're back online.
                            </p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

// Import WifiOff icon
import { WifiOff } from 'lucide-react';
