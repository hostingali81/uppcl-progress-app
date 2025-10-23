// src/app/dashboard/work/[id]/UpdateProgressForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateWorkProgress } from "./actions";
import { TrendingUp, Save, CheckCircle, AlertCircle, Loader2, Target, MessageSquare, Edit3 } from "lucide-react";

interface UpdateProgressFormProps {
  workId: number;
  currentProgress: number | null;
  currentRemark: string | null;
}

export function UpdateProgressForm({
  workId,
  currentProgress,
  currentRemark,
}: UpdateProgressFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(currentProgress || 0);
  const [isOpen, setIsOpen] = useState(false);

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
      <DialogContent className="sm:max-w-[500px]">
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
          
          <DialogFooter className="gap-3">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}