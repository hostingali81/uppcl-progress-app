// src/app/dashboard/work/[id]/UpdateProgressForm.tsx
"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUploader } from "react-drag-drop-files";
import { generateUploadUrl, addAttachmentToWork } from "./actions";
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
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(currentProgress || 0);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadState, setUploadState] = useState<FileUploadState>({
    uploading: false,
    error: null,
    uploadedFiles: []
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await updateWorkProgress(formData);
      if (result?.error) {
        setMessage({ text: result.error, type: 'error' });
      } else {
        setMessage({ text: result.success || 'Progress updated successfully!', type: 'success' });
        setProgress(Number(formData.get('progress')));
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 1500);
      }
    });
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return 'from-green-500 to-emerald-600';
    if (p >= 75) return 'from-blue-500 to-indigo-600';
    if (p >= 50) return 'from-yellow-500 to-amber-600';
    if (p >= 25) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700"
        >
          <Edit3 className="h-4 w-4" />
          Update Progress
          <div className="ml-2 flex items-center gap-1">
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
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <FileUploader
              handleChange={async (fileOrFiles: File | File[]) => {
                const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
                try {
                  setUploadState(prev => ({ ...prev, uploading: true, error: null }));
                  
                  // Generate upload URL
                  const result = await generateUploadUrl(file.name, file.type);
                  if (result.error) {
                    throw new Error(result.error);
                  }

                  // Upload to R2
                  if (!result.success) throw new Error("Failed to get upload URL");
                  const { uploadUrl, publicFileUrl } = result.success;
                  const uploadResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    body: file,
                    headers: {
                      "Content-Type": file.type
                    }
                  });

                  if (!uploadResponse.ok) {
                    throw new Error("Failed to upload file");
                  }

                  // Add attachment record
                  const attachResult = await addAttachmentToWork(workId, publicFileUrl, file.name);
                  if (attachResult.error) {
                    throw new Error(attachResult.error);
                  }

                  setUploadState(prev => ({
                    ...prev,
                    uploading: false,
                    uploadedFiles: [...prev.uploadedFiles, { url: publicFileUrl, name: file.name }]
                  }));
                } catch (error: unknown) {
                  setUploadState(prev => ({
                    ...prev,
                    uploading: false,
                    error: error instanceof Error ? error.message : "Failed to upload file"
                  }));
                }
              }}
              name="photos"
              types={["JPG", "JPEG", "PNG", "WEBP"]}
              multiple={true}
              maxSize={5}
            >
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-600 mb-1">
                  Drag & drop photos here or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supports: JPG, PNG, WEBP (Max: 5MB)
                </p>
              </div>
            </FileUploader>

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
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending} 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
