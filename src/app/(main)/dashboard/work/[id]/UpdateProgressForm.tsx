// src/app/dashboard/work/[id]/UpdateProgressForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateWorkProgress } from "./actions";
import { TrendingUp, Save } from "lucide-react";

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await updateWorkProgress(formData);
      if (result?.error) {
        setMessage({ text: result.error, type: 'error' });
      } else {
        setMessage({ text: result.success || 'Updated!', type: 'success' });
      }
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg font-semibold text-slate-900">Update Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="workId" value={workId} />
          
          <div className="space-y-2">
            <Label htmlFor="progress" className="text-sm font-medium text-slate-700">Current Progress (%)</Label>
            <Input
              id="progress"
              name="progress"
              type="number"
              min="0"
              max="100"
              defaultValue={currentProgress || 0}
              required
              className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remark" className="text-sm font-medium text-slate-700">Remarks</Label>
            <Textarea
              id="remark"
              name="remark"
              defaultValue={currentRemark || ""}
              placeholder="Add any information about the work status..."
              className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Updating..." : "Update Progress"}
          </Button>
          
          {message && (
             <div className={`text-sm p-3 rounded-lg border ${
               message.type === 'error' 
                 ? 'text-red-700 bg-red-50 border-red-200' 
                 : 'text-green-700 bg-green-50 border-green-200'
             }`}>
               {message.text}
             </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}