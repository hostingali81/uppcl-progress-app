// src/components/custom/FileUploadManager.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addAttachmentToWork, deleteAttachment } from "@/app/(main)/dashboard/work/[id]/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ImageIcon, Trash2, User, Loader2, Upload, Paperclip, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

// Type definition for attachments
type Attachment = {
  id: number;
  file_url: string;
  file_name: string | null;
  uploader_full_name: string | null;
  uploader_id: string;
  created_at: string;
};

interface FileUploadManagerProps {
  workId: number;
  attachments: Attachment[] | null;
  currentUserId: string;
}

// Helper function to detect file type
const getFileType = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  return 'other';
};

// Attachment Card Component
function AttachmentCard({ att, currentUserId, isPending, handleDelete }: { att: Attachment; currentUserId: string; isPending: boolean; handleDelete: (id: number) => void }) {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const fileType = getFileType(att.file_url);

    // Extract the file extension from the URL
    const urlParts = att.file_url.split('.');
    const extension = urlParts[urlParts.length - 1]?.split('?')[0] || 'jpg'; // Remove query params if any

    // Ensure filename has the correct extension
    let fileName = att.file_name || `file-${att.id}`;
    // Check if filename already has an extension
    if (!fileName.includes('.')) {
      fileName = `${fileName}.${extension}`;
    }

    if (fileType === 'image') {
      // Use API route for images to handle CORS and proper download
      const params = new URLSearchParams({
        url: att.file_url,
        filename: fileName
      });
      const downloadUrl = '/api/download-photo?' + params.toString();

      // Create a hidden link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } else {
      // For PDFs and other documents, use direct download
      const link = document.createElement('a');
      link.href = att.file_url;
      link.download = fileName;
      link.target = '_blank';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  };

  return (
    <div className="relative group border border-slate-200 rounded-lg p-2 flex flex-col justify-between bg-white hover:shadow-md transition-shadow">
      <Link href={att.file_url} target="_blank" rel="noopener noreferrer" className="grow">
        <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-md mb-2">
          {getFileType(att.file_url) === 'image' ? (
            <img
              src={att.file_url}
              alt={att.file_name || 'Uploaded image'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 flex flex-col items-center justify-center h-full">
              {getFileType(att.file_url) === 'pdf' ? (
                <>
                  <FileText className="h-12 w-12 text-red-500 mb-2" />
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">PDF</span>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-blue-500 mb-2" />
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {att.file_url.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
        </div>
      </Link>
      <div className="text-xs mt-auto">
        <p className="font-medium truncate text-slate-900">{att.file_name || "Untitled"}</p>
        <p className="text-slate-500 flex items-center gap-1"><User size={12} /> {att.uploader_full_name?.split(' ')[0] || 'N/A'}</p>
      </div>

      {/* Download Button - Always visible on mobile, hover on desktop */}
      <Button
        variant="default"
        size="icon"
        className="absolute top-1 left-1 h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700"
        onClick={handleDownload}
        disabled={isPending}
        aria-label="Download file"
      >
        <Download size={14} />
      </Button>

      {/* Delete Button - Only for uploader, always visible on mobile */}
      {(currentUserId === att.uploader_id) && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
          onClick={() => handleDelete(att.id)}
          disabled={isPending}
          aria-label="Delete file"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />}
        </Button>
      )}
    </div>
  );
}

export function FileUploadManager({ workId, attachments, currentUserId }: FileUploadManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [attachmentType, setAttachmentType] = useState<string>('site_photo');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (files.length === 0) {
      setMessage({ text: "Please select at least one file to upload.", type: 'error' });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const selectedAttachmentType = formData.get('attachmentType') as string;

    // Maximum file size (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Allowed file types based on attachment type
    const IMAGE_TYPES = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    const DOCUMENT_TYPES = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const ALLOWED_TYPES = selectedAttachmentType === 'site_photo' ? IMAGE_TYPES : DOCUMENT_TYPES;

    // Validate each file before uploading
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setMessage({
          text: `File ${file.name} is too large. Maximum size is 10MB.`,
          type: 'error'
        });
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        const allowedFormatsText = selectedAttachmentType === 'site_photo'
          ? 'images only (JPEG, PNG, GIF, WebP)'
          : 'images, PDF, Word, and Excel documents';
        setMessage({
          text: `File ${file.name} has unsupported format. Allowed types for ${selectedAttachmentType === 'site_photo' ? 'Site Photographs' : 'Other Documents'}: ${allowedFormatsText}.`,
          type: 'error'
        });
        return;
      }
    }

    startTransition(async () => {
      let uploadCount = 0;
      for (const file of files) {
        console.log('Uploading file via API route for:', { fileName: file.name, fileType: file.type, fileSize: file.size });

        // Create FormData for API upload
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("workId", workId.toString());
        uploadFormData.append("attachmentType", selectedAttachmentType);

        console.log(`Starting file upload to /api/upload for ${file.name}...`);

        try {
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          console.log('API upload response status for', file.name, ':', uploadResponse.status);

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Failed to upload file' }));
            console.error('Upload failed for', file.name, ':', errorData.error);
            setMessage({
              text: `Upload failed for ${file.name}: ${errorData.error}`,
              type: 'error'
            });
            return;
          }

          const uploadData = await uploadResponse.json();
          console.log('File upload successful for', file.name, ':', uploadData);

        } catch (uploadError: unknown) {
          const fileName = file?.name || 'the selected file';
          const errorMessage = uploadError instanceof Error
            ? uploadError.message
            : 'An unknown error occurred during upload.';

          console.error(`Upload error for ${fileName}:`, errorMessage);
          console.error('Full error object:', uploadError);

          setMessage({
            text: `Upload failed for ${fileName}. Error: ${errorMessage}`,
            type: 'error'
          });
          return;
        }

        uploadCount++;
      }

      setMessage({ text: `${uploadCount} file(s) uploaded successfully!`, type: 'success' });
      setFiles([]);
      const form = event.target as HTMLFormElement;
      form.reset();

      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1500);
    });
  };

  const handleDelete = (attachmentId: number) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      startTransition(async () => {
        const result = await deleteAttachment(attachmentId, workId);
        setMessage({ text: result.error || result.success || 'File deleted successfully!', type: result.error ? 'error' : 'success' });
        setTimeout(() => setMessage(null), 2000);
      });
    }
  };

  const attachmentCount = attachments?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-slate-200 hover:bg-purple-50 hover:border-purple-300 text-slate-700 hover:text-purple-700"
        >
          <Paperclip className="h-4 w-4" />
          Manage Files
          {attachmentCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              {attachmentCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Upload className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">File Management</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            Upload and manage project documents and images for this work.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attachment-type" className="text-sm font-medium text-slate-700">File Type</Label>
              <select
                id="attachment-type"
                name="attachmentType"
                value={attachmentType}
                onChange={(e) => {
                  setAttachmentType(e.target.value);
                  setFiles([]); // Clear selected files when changing type
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) fileInput.value = ''; // Reset file input
                }}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="site_photo">Site Photograph</option>
                <option value="document">Other Document</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm font-medium text-slate-700">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept={attachmentType === 'site_photo' ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp' : 'image/*,.pdf,.doc,.docx,.xls,.xlsx'}
                onChange={handleFileChange}
                disabled={isPending}
                className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Selected Files:</Label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={isPending || files.length === 0} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isPending ? "Uploading..." : `Upload ${files.length} file(s)`}
            </Button>

            {message && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${message.type === 'error'
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-green-700 bg-green-50 border-green-200'
                }`}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            )}
          </form>

          {/* Existing Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-6">
              {/* Site Photographs */}
              {attachments.filter(a => (a as any).attachment_type === 'site_photo' || !(a as any).attachment_type).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Site Photographs ({attachments.filter(a => (a as any).attachment_type === 'site_photo' || !(a as any).attachment_type).length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {attachments.filter(a => (a as any).attachment_type === 'site_photo' || !(a as any).attachment_type).map((att) => (
                      <AttachmentCard key={att.id} att={att} currentUserId={currentUserId} isPending={isPending} handleDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Documents */}
              {attachments.filter(a => (a as any).attachment_type === 'document').length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Other Documents ({attachments.filter(a => (a as any).attachment_type === 'document').length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {attachments.filter(a => (a as any).attachment_type === 'document').map((att) => (
                      <AttachmentCard key={att.id} att={att} currentUserId={currentUserId} isPending={isPending} handleDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-slate-200 hover:bg-slate-50"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
