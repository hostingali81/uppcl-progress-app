// src/app/dashboard/work/[id]/UpdateProgressForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Native file input component instead of FileUploader library
const NativeFileInput = ({ onChange, multiple = false, accept = "", disabled = false, children }: {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <label className="cursor-pointer">
    <input
      type="file"
      multiple={multiple}
      accept={accept}
      disabled={disabled}
      onChange={onChange}
      style={{ display: 'none' }}
    />
    {children}
  </label>
);

import { updateWorkProgress } from "./actions";
import { TrendingUp, Save, CheckCircle, AlertCircle, Loader2, Target, MessageSquare, Edit3 } from "lucide-react";

interface UpdateProgressFormProps {
  workId: number;
  currentProgress: number | null;
  currentRemark: string | null;
  currentExpectedCompletionDate: string | null;
  currentActualCompletionDate: string | null;
}

type FileUploadState = {
  uploading: boolean;
  error: string | null;
  uploadedFiles: { url: string; name: string; }[];
};

export function UpdateProgressForm({
  workId,
  currentProgress,
  currentRemark,
  currentExpectedCompletionDate,
  currentActualCompletionDate,
}: UpdateProgressFormProps) {
  const [isPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(currentProgress || 0);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadState, setUploadState] = useState<FileUploadState>({
    uploading: false,
    error: null,
    uploadedFiles: []
  });

  const getProgressColor = (p: number) => {
    if (p >= 100) return 'from-green-500 to-emerald-600';
    if (p >= 75) return 'from-blue-500 to-indigo-600';
    if (p >= 50) return 'from-yellow-500 to-amber-600';
    if (p >= 25) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-pink-600';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          error: `File ${file.name} is too large. Maximum size is 5MB.`
        }));
        return;
      }
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          error: `File ${file.name} has unsupported format. Allowed types: JPG, PNG, WEBP`
        }));
        return;
      }
    }

    // Upload each file
    for (const file of files) {
      try {
        setUploadState(prev => ({ ...prev, uploading: true, error: null }));

        // Create FormData for API upload
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("workId", workId.toString());

        console.log("Uploading file via API route...", file.name);

        // Upload via Next.js API route
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload file");
        }

        const uploadData = await uploadResponse.json();
        console.log("File upload successful via API!", uploadData);

        setUploadState(prev => ({
          ...prev,
          uploading: false,
          uploadedFiles: [...prev.uploadedFiles, {
            url: uploadData.publicFileUrl,
            name: uploadData.fileName
          }]
        }));
      } catch (error: unknown) {
        console.error("Upload error:", error);
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          error: error instanceof Error ? error.message : "Failed to upload file"
        }));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 sm:h-9 sm:px-4 sm:py-2 sm:text-sm max-sm:h-8 max-sm:px-2 max-sm:py-1 max-sm:text-xs max-[480px]:px-1 max-[480px]:text-[10px]"
        >
          <Edit3 className="h-4 w-4 max-sm:h-3 max-sm:w-3" />
          <span className="max-[480px]:hidden">Update Progress</span>
          <span className="sm:hidden max-[480px]:block">Update</span>
          <div className="ml-2 flex items-center gap-1 max-sm:hidden">
            <span className="text-xs font-medium">{progress}%</span>
            <div className="w-8 bg-slate-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full bg-gradient-to-r ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] sm:max-w-[500px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Update Progress</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            Update the completion percentage and add remarks about the current status of this work.
          </DialogDescription>
        </DialogHeader>
        
        <form action={updateWorkProgress} className="space-y-6 overflow-y-auto flex-1 pr-2">
          <input type="hidden" name="workId" value={workId} />

          {/* Current Progress Display */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Current Progress</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="progress" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Progress Percentage
            </Label>
            <div className="relative">
              <Input
                id="progress"
                name="progress"
                type="number"
                min="0"
                max="100"
                defaultValue={currentProgress || 0}
                required
                className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-12 text-lg font-semibold text-center pr-12"
                onChange={(e) => setProgress(Number(e.target.value))}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expected Completion Date */}
            <div className="space-y-3">
              <Label htmlFor="expectedCompletionDate" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Expected Completion Date
              </Label>
              <Input
                id="expectedCompletionDate"
                name="expectedCompletionDate"
                type="date"
                defaultValue={currentExpectedCompletionDate || ""}
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Actual Completion Date */}
            <div className="space-y-3">
              <Label htmlFor="actualCompletionDate" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Actual Completion Date
              </Label>
              <Input
                id="actualCompletionDate"
                name="actualCompletionDate"
                type="date"
                defaultValue={currentActualCompletionDate || ""}
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="remark" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Progress Remarks
            </Label>
            <Textarea
              id="remark"
              name="remark"
              defaultValue={currentRemark || ""}
              placeholder="Describe the current status, completed tasks, or any important updates..."
              className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-none"
              rows={4}
            />
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <Label htmlFor="photos" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Progress Photos
            </Label>
            <NativeFileInput
              multiple={true}
              accept="image/*"
              disabled={uploadState.uploading}
              onChange={handleFileUpload}
            >
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-600 mb-1">
                  Click to browse or drag & drop photos here
                </p>
                <p className="text-xs text-slate-500">
                  Supports: JPG, PNG, WEBP (Max: 5MB each)
                </p>
              </div>
            </NativeFileInput>

            {/* Preview uploaded files */}
            {uploadState.uploadedFiles.length > 0 && (
              <div className="mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {uploadState.uploadedFiles.map((file, index) => (
                    <div key={index} className="relative aspect-video">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload state messages */}
            {uploadState.uploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            )}
            {uploadState.error && (
              <div className="text-sm text-red-600">{uploadState.error}</div>
            )}
          </div>

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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Progress
                </>
              )}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
