// src/components/custom/ProgressPhotosSection.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Trash2, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAttachment } from "@/app/(main)/dashboard/work/[id]/actions";
import type { Attachment } from "@/lib/types";
import { PhotoViewerModal } from "./PhotoViewerModal";

interface ProgressPhotosSectionProps {
  attachments: Attachment[];
  workId: number;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

export function ProgressPhotosSection({ attachments, workId }: ProgressPhotosSectionProps) {
  // State for photo viewer modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleDelete = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    
    const result = await deleteAttachment(attachmentId, workId);
    if (result.error) {
      alert(result.error);
    }
  };

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsModalOpen(true);
  };

  const handlePhotoChange = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!attachments || attachments.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Camera className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">Progress Photos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No photos uploaded yet.</p>
            <p className="text-sm text-slate-400 mt-1">Photos uploaded with progress updates will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Camera className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">Progress Photos</CardTitle>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              {attachments.length} photo{attachments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((attachment, index) => (
              <div key={attachment.id} className="relative group">
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200">
                  <div 
                    className="block w-full h-full relative cursor-pointer"
                    onClick={() => handlePhotoClick(index)}
                  >
                    <img 
                      src={attachment.file_url} 
                      alt={`Progress photo ${formatTimeAgo(attachment.created_at)}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Click to view</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="h-3 w-3" />
                      <span>{attachment.uploader_full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatTimeAgo(attachment.created_at)}</span>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        photos={attachments}
        currentPhotoIndex={currentPhotoIndex}
        onPhotoChange={handlePhotoChange}
      />
    </>
  );
}
