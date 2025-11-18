// src/components/custom/ProgressLogsSection.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, User, Calendar, MessageSquare, Camera } from "lucide-react";
import type { ProgressLog } from "@/lib/types";
import { PhotoViewerModal } from "./PhotoViewerModal";

interface ProgressLogsSectionProps {
  progressLogs: ProgressLog[];
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

function getProgressChangeColor(previous: number | null, current: number) {
  if (previous === null) return "bg-blue-100 text-blue-700";
  if (current > previous) return "bg-green-100 text-green-700";
  if (current < previous) return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function getProgressChangeIcon(previous: number | null, current: number) {
  if (previous === null) return "📊";
  if (current > previous) return "📈";
  if (current < previous) return "📉";
  return "➡️";
}

export function ProgressLogsSection({ progressLogs }: ProgressLogsSectionProps) {
  // State for photo viewer modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<any[]>([]);

  // Format user display name from the data - PRIORITIZE user_full_name
  const getUserDisplayName = (log: ProgressLog) => {
    // First try user_full_name (from the progress_logs table)
    const userFullName = (log as any).user_full_name;
    if (userFullName && userFullName.trim()) {
      return userFullName;
    }
    
    // Fallback to profiles full_name
    const profileName = log.profiles?.full_name;
    if (profileName && profileName.trim()) {
      return profileName;
    }
    
    // Final fallback to email
    return log.user_email || 'Unknown User';
  };

  // Handle photo click to open modal
  const handlePhotoClick = (photos: any[], index: number) => {
    setAllPhotos(photos);
    setCurrentPhotoIndex(index);
    setIsModalOpen(true);
  };

  const handlePhotoChange = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAllPhotos([]);
    setCurrentPhotoIndex(0);
  };

  if (!progressLogs || progressLogs.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">Progress History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No progress updates recorded yet.</p>
            <p className="text-sm text-slate-400 mt-1">Progress updates will appear here once you start tracking work progress.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">Progress History</CardTitle>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 self-start sm:self-auto w-fit">
              {progressLogs.length} update{progressLogs.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-4">
            {progressLogs.map((log) => {
              const sitePhotos = log.attachments?.filter((a: any) => a.attachment_type === 'site_photo' || !a.attachment_type) || [];
              
              return (
                <div key={log.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0">
                        {getProgressChangeIcon(log.previous_progress, log.new_progress)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={`${getProgressChangeColor(log.previous_progress, log.new_progress)} text-xs`}
                          >
                            {log.previous_progress !== null 
                              ? `${log.previous_progress}% → ${log.new_progress}%`
                              : `Started at ${log.new_progress}%`
                            }
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{getUserDisplayName(log)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span suppressHydrationWarning>{formatTimeAgo(log.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right sm:text-left sm:flex-shrink-0">
                      <div className="text-lg font-medium text-slate-900">
                        {log.new_progress}%
                      </div>
                      <div className="text-xs text-slate-500">
                        Current
                      </div>
                    </div>
                  </div>
                  
                  {log.remark && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700 leading-relaxed break-words">{log.remark}</p>
                      </div>
                    </div>
                  )}
                  
                  {sitePhotos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">Site Photos ({sitePhotos.length})</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sitePhotos.map((attachment: any, index: number) => (
                          <div
                            key={attachment.id}
                            className="block aspect-video w-full overflow-hidden rounded-lg border border-slate-200 hover:border-blue-500 transition-all cursor-pointer group"
                            onClick={() => handlePhotoClick(sitePhotos, index)}
                          >
                            <img
                              src={attachment.file_url}
                              alt={`Progress photo ${formatTimeAgo(attachment.created_at)}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              suppressHydrationWarning
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Click to view</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        photos={allPhotos}
        currentPhotoIndex={currentPhotoIndex}
        onPhotoChange={handlePhotoChange}
      />
    </>
  );
}
