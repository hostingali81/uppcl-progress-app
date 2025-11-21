// src/components/custom/ProgressLogsSection.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, User, Calendar, MessageSquare, Camera, ChevronDown, ChevronUp } from "lucide-react";
import type { ProgressLog } from "@/lib/types";


interface ProgressLogsSectionProps {
  progressLogs: ProgressLog[];
  allAttachments?: any[];
}

interface PhotoAttachment {
  id: string | number;
  file_url: string;
  file_name?: string;
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

export function ProgressLogsSection({ progressLogs, allAttachments = [] }: ProgressLogsSectionProps) {
  // State for showing archive data
  const [showArchive, setShowArchive] = useState(false);

  // Format user display name from the data - STRICTLY prioritize user_full_name and remove email fallback
  const getUserDisplayName = (log: ProgressLog) => {
    // First priority: user_full_name from the progress_logs table ( person's actual name )
    const userFullName = (log as any).user_full_name;
    if (userFullName && userFullName.trim() && userFullName !== userFullName.includes('@') ? userFullName.split('@')[0] : userFullName) {
      return userFullName;
    }

    // Second priority: profiles full_name from join
    const profileName = log.profiles?.full_name;
    if (profileName && profileName.trim() && !profileName.includes('@')) {
      return profileName;
    }

    // Third priority: try to extract name from email (remove @domain.com)
    if (log.user_email && log.user_email.includes('@')) {
      const nameFromEmail = log.user_email.split('@')[0];
      if (nameFromEmail && nameFromEmail.length > 0) {
        // Capitalize first letter
        return nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      }
    }

    // Final fallback
    return 'A user';
  };

  // Handle photo click to open in new tab with navigation for multiple photos
  const handlePhotoClick = (sitePhotos: any[], currentIndex: number, clickedPhotoUrl?: string, clickedFileName?: string) => {
    // If single photo click, find the index
    let photoIndex = currentIndex;
    if (clickedPhotoUrl) {
      photoIndex = sitePhotos.findIndex((photo: any) => photo.file_url === clickedPhotoUrl);
      if (photoIndex === -1) photoIndex = 0;
    }

    const currentPhoto = sitePhotos[photoIndex];
    const photoUrl = currentPhoto?.file_url || clickedPhotoUrl;
    const fileName = currentPhoto?.file_name || clickedFileName || 'Progress Photo';

    // Create HTML content for photo viewer with navigation
    const photoViewerHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${fileName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #000;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .viewer {
            position: relative;
            max-width: 100vw;
            max-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .image-container {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .photo {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          }
          .nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            transition: all 0.3s ease;
            z-index: 10;
          }
          .nav-btn:hover {
            background: rgba(0,0,0,0.9);
            transform: translateY(-50%) scale(1.1);
          }
          .nav-btn.left {
            left: 20px;
          }
          .nav-btn.right {
            right: 20px;
          }
          .nav-btn.disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
          .nav-btn.disabled:hover {
            transform: translateY(-50%);
            background: rgba(0,0,0,0.8);
          }
          .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.3s ease;
          }
          .close-btn:hover {
            background: rgba(0,0,0,0.9);
            transform: scale(1.1);
          }
          .info {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
          }
          .download-btn {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
          }
          .download-btn:hover {
            background: rgba(0,0,0,0.9);
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="viewer">
          <button class="close-btn" onclick="window.close()">&times;</button>

          <button class="nav-btn left ${sitePhotos.length <= 1 ? 'disabled' : ''}"
                  onclick="changePhoto(-1)"
                  ${sitePhotos.length <= 1 ? 'disabled' : ''}>
            &#8249;
          </button>

          <div class="image-container">
            <img class="photo" id="currentPhoto"
                 src="${photoUrl}"
                 alt="${fileName}"
                 onload="fitImage()">
          </div>

          <button class="nav-btn right ${sitePhotos.length <= 1 ? 'disabled' : ''}"
                  onclick="changePhoto(1)"
                  ${sitePhotos.length <= 1 ? 'disabled' : ''}>
            &#8250;
          </button>

          <div class="info">${photoIndex + 1} of ${sitePhotos.length}</div>

          <button class="download-btn" onclick="downloadPhoto(event)">
            📥 Download
          </button>
        </div>

        <script>
          const photos = ${JSON.stringify(sitePhotos)};
          let currentIndex = ${photoIndex};

          function downloadPhoto(event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            
            const photo = photos[currentIndex];
            const photoUrl = photo.file_url;
            const fileName = photo.file_name || 'progress-photo-' + (currentIndex + 1) + '.jpg';
            
            // Use API route to download with proper headers - construct URL properly
            const params = new URLSearchParams();
            params.set('url', photoUrl);
            params.set('filename', fileName);
            const downloadUrl = '/api/download-photo?' + params.toString();
            
            // Get the absolute URL (important when in blob context)
            const absoluteUrl = new URL(downloadUrl, window.location.origin).href;
            
            // Trigger download using window.open with _self to avoid new tab
            window.open(absoluteUrl, '_self');
          }

          function changePhoto(direction) {
            if (photos.length <= 1) return;

            currentIndex += direction;
            if (currentIndex < 0) currentIndex = photos.length - 1;
            if (currentIndex >= photos.length) currentIndex = 0;

            const photo = photos[currentIndex];
            document.getElementById('currentPhoto').src = photo.file_url;
            document.querySelector('.info').textContent = (currentIndex + 1) + ' of ' + photos.length;
            document.title = photo.file_name || 'Progress Photo';

            // Fit image to screen
            setTimeout(fitImage, 100);
          }

          function fitImage() {
            const img = document.getElementById('currentPhoto');
            const container = document.querySelector('.image-container');

            // Calculate scale to fit image in container while maintaining aspect ratio
            const scaleX = container.clientWidth / img.naturalWidth;
            const scaleY = container.clientHeight / img.naturalHeight;
            const scale = Math.min(scaleX, scaleY, 1);

            if (scale < 1) {
              img.style.maxWidth = (img.naturalWidth * scale) + 'px';
              img.style.maxHeight = (img.naturalHeight * scale) + 'px';
            }
          }

          // Handle keyboard navigation
          document.addEventListener('keydown', function(e) {
            switch(e.key) {
              case 'ArrowLeft':
                changePhoto(-1);
                break;
              case 'ArrowRight':
                changePhoto(1);
                break;
              case 'Escape':
                window.close();
                break;
            }
          });

          // Handle touch/swipe navigation on mobile
          let startX = 0;
          let endX = 0;

          document.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
          });

          document.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) { // Minimum swipe distance
              if (diff > 0) {
                changePhoto(1); // Swipe left - next photo
              } else {
                changePhoto(-1); // Swipe right - previous photo
              }
            }
          });

          // Fit image on window resize
          window.addEventListener('resize', fitImage);

          // Initial fit
          fitImage();
        </script>
      </body>
      </html>
    `;

    // Create a blob URL for the HTML content
    const blob = new Blob([photoViewerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open the photo viewer in a new tab
    const newTab = window.open(url, '_blank');

    if (newTab) {
      newTab.document.title = fileName;
    }

    // Clean up blob URL after some time
    setTimeout(() => URL.revokeObjectURL(url), 60000);
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
            {/* Show only last 4 updates by default */}
            {(showArchive ? progressLogs : progressLogs.slice(0, 4)).map((log) => {
              // Get photos from already linked attachments in the progress log data
              const sitePhotos = (log as any).attachments || [];

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
                            <span className="truncate font-medium">{getUserDisplayName(log)}</span>
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
                      <div className="space-y-3">
                        {/* Photo count and view button */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 flex items-center gap-2">
                            <Camera className="h-3 w-3" />
                            Progress Photos ({sitePhotos.length})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePhotoClick(sitePhotos, 0)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 h-auto text-xs"
                          >
                            View First
                          </Button>
                        </div>

                        {/* Small, compact photo thumbnails - Reduced to 75% size */}
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 sm:gap-2">
                          {sitePhotos.slice(0, 8).map((photo: PhotoAttachment, index: number) => (
                            <div
                              key={photo.id}
                              className="relative group cursor-pointer"
                              onClick={() => handlePhotoClick(sitePhotos, index, photo.file_url, photo.file_name)}
                            >
                              <div className="aspect-square w-[75%] mx-auto overflow-hidden rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                <img
                                  src={photo.file_url}
                                  alt={photo.file_name || `Progress photo`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-[12.5%] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Show more indicator */}
                        {sitePhotos.length > 8 && (
                          <p className="text-xs text-slate-500 text-center mt-2">
                            +{sitePhotos.length - 8} more photos available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show Archive Button - Only when there are more than 4 logs */}
            {!showArchive && progressLogs.length > 4 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowArchive(true)}
                  className="text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400"
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Archive/Old Data ({progressLogs.length - 4} more)
                </Button>
              </div>
            )}

            {/* Show Less Button - Only when archive is shown */}
            {showArchive && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowArchive(false)}
                  className="text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400"
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Archive
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos now open directly in new tabs - no modal needed */}
    </>
  );
}
