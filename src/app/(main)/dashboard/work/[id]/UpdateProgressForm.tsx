// src/app/dashboard/work/[id]/UpdateProgressForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateWorkProgress } from "./actions";

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
    <Card>
      <CardHeader>
        <CardTitle>प्रगति अपडेट करें</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="workId" value={workId} />
          
          <div className="space-y-2">
            <Label htmlFor="progress">वर्तमान प्रगति (%)</Label>
            <Input
              id="progress"
              name="progress"
              type="number"
              min="0"
              max="100"
              defaultValue={currentProgress || 0}
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remark">रिमार्क</Label>
            <Textarea
              id="remark"
              name="remark"
              defaultValue={currentRemark || ""}
              placeholder="काम की स्थिति के बारे में कोई भी जानकारी..."
              className="w-full"
            />
          </div>
          
          <Button type="submit" disabled={isPending}>
            {isPending ? "अपडेट हो रहा है..." : "अपडेट करें"}
          </Button>
          
          {message && (
             <p className={`text-sm mt-2 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
               {message.text}
             </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}