// src/components/custom/UpdatePasswordForm.tsx
"use client";
import { updateUserPassword } from "@/app/(main)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransition, useState, useRef } from "react";

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
      // --- यहाँ बदलाव किया गया है ---
      setMessage(result.error || result.success || null);
      if (result.success) {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">नया पासवर्ड</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "अपडेट हो रहा है..." : "पासワード बदलें"}
      </Button>
      {message && <p className={`text-sm mt-2 ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
    </form>
  );
}