
"use client";

import type { Attachment } from "@/lib/types";

interface PhotoGridProps {
  photos: Attachment[];
  onPhotoClick: (index: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-200 cursor-pointer group"
          onClick={() => onPhotoClick(index)}
        >
          <img
            src={photo.file_url}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">View</span>
          </div>
        </div>
      ))}
    </div>
  );
}