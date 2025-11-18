// src/components/custom/PhotoViewerModal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [zoom, setZoom] = useState(1);

  const currentPhoto = photos[currentPhotoIndex];
  
  if (!currentPhoto) return null;

  const goToPrevious = () => {
    const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
    onPhotoChange(newIndex);
    setZoom(1);
  };

  const goToNext = () => {
    const newIndex = currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
    onPhotoChange(newIndex);
    setZoom(1);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.file_url;
    link.download = currentPhoto.file_name || `photo-${currentPhotoIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
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
                {/* Zoom Controls */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white text-sm min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                {/* Download Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Download className="h-4 w-4" />
                </Button>

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
          <div 
            className="flex items-center justify-center w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <img
              src={currentPhoto.file_url}
              alt={currentPhoto.file_name || `Photo ${currentPhotoIndex + 1}`}
              className="max-w-none transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom})`,
                maxHeight: zoom === 1 ? '90vh' : 'none',
                maxWidth: zoom === 1 ? '90vw' : 'none'
              }}
              draggable={false}
            />
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
                      setZoom(1);
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
