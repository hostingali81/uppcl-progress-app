// src/components/custom/PhotoViewerModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: { id: number; file_url: string; file_name?: string; uploader_full_name?: string | null; created_at: string }[];
  currentPhotoIndex: number;
  onPhotoChange: (index: number) => void;
}

export function PhotoViewerModal({
  isOpen,
  onClose,
  photos,
  currentPhotoIndex,
  onPhotoChange
}: PhotoViewerModalProps) {
  const currentPhoto = photos[currentPhotoIndex];

  if (!currentPhoto) return null;

  const goToPrevious = () => {
    const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
    onPhotoChange(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
    onPhotoChange(newIndex);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Extract filename and extension
    const urlParts = currentPhoto.file_url.split('.');
    const extension = urlParts[urlParts.length - 1] || 'jpg';
    const fileName = currentPhoto.file_name 
      ? `${currentPhoto.file_name}.${extension}`
      : `photo-${currentPhotoIndex + 1}.${extension}`;
    
    // Try multiple download methods
    const tryDownload = async () => {
      try {
        // Method 1: Fetch and blob download
        const response = await fetch(currentPhoto.file_url, {
          mode: 'cors',
          cache: 'force-cache'
        });
        
        if (!response.ok) throw new Error('Fetch failed');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        
      } catch (error) {
        console.log('Blob download failed, trying direct link...');
        
        try {
          // Method 2: Direct download link
          const link = document.createElement('a');
          link.href = currentPhoto.file_url;
          link.download = fileName;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 500);
          
        } catch (error2) {
          console.log('Direct download failed, opening in new tab...');
          
          // Method 3: Open in new tab with download instructions
          const newWindow = window.open(currentPhoto.file_url, '_blank', 'noopener,noreferrer');
          
          // Add download instruction for user
          if (newWindow) {
            setTimeout(() => {
              if (newWindow.document) {
                newWindow.document.title = `Download: ${fileName}`;
                const instruction = newWindow.document.createElement('div');
                instruction.innerHTML = `
                  <div style="padding: 20px; font-family: Arial; text-align: center; background: #f0f0f0;">
                    <h3>Right-click the image and select "Save image as..." to download</h3>
                    <p>Or press Ctrl+S (Windows) / Cmd+S (Mac) to save</p>
                  </div>
                `;
                newWindow.document.body.insertBefore(instruction, newWindow.document.body.firstChild);
              }
            }, 1000);
          }
        }
      }
    };
    
    tryDownload();
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
        style={{ touchAction: 'pinch-zoom none' }}>
        {/* Screen reader accessible title */}
        <DialogTitle className="sr-only">
          Photo Viewer - {currentPhoto.file_name || `Photo ${currentPhotoIndex + 1} of ${photos.length}`}
        </DialogTitle>
        <div className="relative w-full h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-lg font-semibold">
                  {currentPhoto.file_name || `Photo ${currentPhotoIndex + 1} of ${photos.length}`}
                </h3>
                <p className="text-sm text-white/80">
                  by {currentPhoto.uploader_full_name || 'Unknown'} • {new Date(currentPhoto.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Button - Custom implementation to prevent event bubbling */}
                <div 
                  onClick={(e) => handleDownload(e)}
                  onMouseDown={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-white/30 bg-white/20 hover:bg-white/30 cursor-pointer transition-colors"
                  title="Download photo"
                >
                  <Download className="h-4 w-4 text-white" />
                </div>

                {/* Close Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onClose}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex items-center justify-center w-full h-full overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center p-20">
              <img
                src={currentPhoto.file_url}
                alt={currentPhoto.file_name || `Photo ${currentPhotoIndex + 1}`}
                className="block transition-transform duration-200 ease-out object-contain"
                style={{
                  maxWidth: 'calc(100% - 40px)',
                  maxHeight: 'calc(100% - 40px)',
                  width: 'auto',
                  height: 'auto'
                }}
                draggable={false}
                onClick={onClose}
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30 z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30 z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          )}

          {/* Thumbnail Navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <div className="flex justify-center gap-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      onPhotoChange(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex
                        ? 'border-white ring-2 ring-white/50'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={photo.file_url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
