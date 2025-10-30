// src/components/custom/FileUploadManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addAttachmentToWork, generateUploadUrl, deleteAttachment } from "@/app/(main)/dashboard/work/[id]/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ImageIcon, Trash2, User, Loader2, Upload, Paperclip, X, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
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

export function FileUploadManager({ workId, attachments, currentUserId }: FileUploadManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

    startTransition(async () => {
      let uploadCount = 0;
      for (const file of files) {
        const result = await generateUploadUrl(file.name, file.type);
        if (result.error) {
          setMessage({ text: `Error generating URL: ${result.error}`, type: 'error' });
          return;
        }

        const uploadResponse = await fetch(result.success!.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
            "x-amz-acl": "public-read"
          }
        });
        if (!uploadResponse.ok) {
          setMessage({ text: `Upload failed for ${file.name}.`, type: 'error' });
          return;
        }

        const { error: dbError } = await addAttachmentToWork(workId, result.success!.publicFileUrl, file.name);
        if (dbError) {
          setMessage({ text: `Failed to save attachment to DB: ${dbError}`, type: 'error' });
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
              <Label htmlFor="file-upload" className="text-sm font-medium text-slate-700">Select Files</Label>
              <Input 
                id="file-upload" 
                type="file" 
                multiple 
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
              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                message.type === 'error' 
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
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Current Attachments ({attachmentCount})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group border border-slate-200 rounded-lg p-2 flex flex-col justify-between bg-white hover:shadow-md transition-shadow">
                    <Link href={att.file_url} target="_blank" rel="noopener noreferrer" className="grow">
                      <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center bg-slate-100 rounded-md mb-2">
                        {getFileType(att.file_url) === 'image' ? (
                          <Image src={att.file_url} alt={att.file_name || 'Uploaded image'} fill className="object-cover" sizes="(max-width: 768px) 50vw, 20vw" />
                        ) : (
                          <div className="text-center p-2">
                            {getFileType(att.file_url) === 'pdf' ? <FileText className="h-8 w-8 mx-auto text-red-500" /> : <ImageIcon className="h-8 w-8 mx-auto text-slate-500" />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                      </div>
                    </Link>
                    <div className="text-xs mt-auto">
                      <p className="font-medium truncate text-slate-900">{att.file_name || "Untitled"}</p>
                      <p className="text-slate-500 flex items-center gap-1"><User size={12} /> {att.uploader_full_name?.split(' ')[0] || 'N/A'}</p>
                    </div>
                    {(currentUserId === att.uploader_id) && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
                        onClick={() => handleDelete(att.id)}
                        disabled={isPending}
                        aria-label="Delete file"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
