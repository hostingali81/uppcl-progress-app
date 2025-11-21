// src/app/dashboard/work/[id]/UpdateProgressForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { TrendingUp, Save, CheckCircle, AlertCircle, Loader2, Target, MessageSquare, Edit3, X } from "lucide-react";

interface UpdateProgressFormProps {
  workId: number;
  currentProgress: number | null;
  currentRemark: string | null;
  currentExpectedCompletionDate: string | null;
  currentActualCompletionDate: string | null;
}

import { useRouter } from "next/navigation";

export function UpdateProgressForm({
  workId,
  currentProgress,
  currentRemark,
  currentExpectedCompletionDate,
  currentActualCompletionDate,
}: UpdateProgressFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(currentProgress || 0);
  const [progressLogId, setProgressLogId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    progress: currentProgress || 0,
    remark: currentRemark || "",
    expectedCompletionDate: currentExpectedCompletionDate || "",
    actualCompletionDate: currentActualCompletionDate || ""
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted!"); // Debug log

    setLoading(true);
    setMessage(null);

    // Create FormData manually
    const submitData = new FormData();
    submitData.append("workId", workId.toString());
    submitData.append("progress", formData.progress.toString());
    submitData.append("remark", formData.remark);
    submitData.append("expectedCompletionDate", formData.expectedCompletionDate);
    submitData.append("actualCompletionDate", formData.actualCompletionDate);

    try {
      console.log("Making API call..."); // Debug log
      const response = await fetch("/api/progress-logs", {
        method: "POST",
        body: submitData,
      });

      console.log("API response:", response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error("Failed to create progress log");
      }

      const data = await response.json();
      console.log("Success:", data); // Debug log
      setProgressLogId(data.progressLogId);
      setStep(2);
      setMessage({ text: "Progress log created successfully! Now upload photos.", type: "success" });
    } catch (error) {
      console.error("Submit error:", error);
      setMessage({ text: "Failed to create progress log", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
    setMessage(null);
    setProgressLogId(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handlePhotoUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedFiles.length === 0 || !progressLogId) return;

    setUploading(true);
    setMessage(null);

    try {
      // Upload files one by one since the API expects single file per request
      const uploadPromises = selectedFiles.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("workId", workId.toString());
        uploadFormData.append("progress_log_id", progressLogId.toString());
        uploadFormData.append("attachmentType", "site_photo");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload ${file.name}: ${response.status} ${errorText}`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);

      console.log("Upload success: All photos uploaded");
      setMessage({ text: "Photos uploaded successfully!", type: "success" });

      // Close dialog after short delay
      setTimeout(() => {
        router.refresh();
        handleClose();
      }, 1500);

    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ text: error instanceof Error ? error.message : "Failed to upload photos", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => console.log("Update Progress button clicked")}
        >
          <Edit3 className="h-4 w-4" />
          Update Progress
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <DialogTitle>
              {step === 1 ? "Update Progress" : "Upload Photos"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            {step === 1 ? "Update the progress percentage and details for this work." : "Upload photos for the progress update."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div>
            <div className="space-y-2 mb-4">
              <Label>Current Progress</Label>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="workId" value={workId} />

              <div className="space-y-2">
                <Label>New Progress Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setProgress(value);
                    handleInputChange('progress', value.toString());
                  }}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Expected Date</Label>
                  <Input
                    type="date"
                    value={formData.expectedCompletionDate}
                    onChange={(e) => handleInputChange('expectedCompletionDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Date</Label>
                  <Input
                    type="date"
                    value={formData.actualCompletionDate}
                    onChange={(e) => handleInputChange('actualCompletionDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="Add your remarks..."
                  rows={3}
                />
              </div>

              {message && (
                <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    console.log("Button clicked!"); // Debug log
                  }}
                >
                  {loading ? (
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-md font-semibold mb-1">Progress Updated Successfully!</h3>
              <p className="text-gray-600 text-sm mb-4">Now you can upload photos for this progress update.</p>
            </div>

            <form onSubmit={handlePhotoUpload} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="photo-upload">Select Photos</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={!progressLogId}
                />
                <p className="text-xs text-gray-500">
                  Supports: JPG, PNG, WEBP (Max: 5MB each)
                </p>

                {selectedFiles.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                  </div>
                )}
              </div>
            </form>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                disabled={selectedFiles.length === 0 || uploading}
                onClick={handlePhotoUpload}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Upload Photos
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Skip & Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
