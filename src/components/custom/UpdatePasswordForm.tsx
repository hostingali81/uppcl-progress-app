// src/components/custom/UpdatePasswordForm.tsx
"use client";
import { updateUserPassword } from "@/app/(main)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransition, useState, useRef } from "react";
import { Key } from "lucide-react";

export function UpdatePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateUserPassword(formData);
      // --- Updated here ---
      setMessage(result.error || result.success || null);
      if (result.success) {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">New Password</Label>
        <Input 
          id="newPassword" 
          name="newPassword" 
          type="password" 
          required 
          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        <Key className="h-4 w-4 mr-2" />
        {isPending ? "Updating..." : "Change Password"}
      </Button>
      {message && (
        <div className={`text-sm p-3 rounded-lg border ${
          message.includes('successfully') 
            ? 'text-green-700 bg-green-50 border-green-200' 
            : 'text-red-700 bg-red-50 border-red-200'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}