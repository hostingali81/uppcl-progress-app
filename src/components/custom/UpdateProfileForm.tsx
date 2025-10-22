// src/components/custom/UpdateProfileForm.tsx
"use client";
import { updateUserProfile } from "@/app/(main)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransition, useState } from "react";

export function UpdateProfileForm({ fullName }: { fullName: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateUserProfile(formData);
      // --- यहाँ बदलाव किया गया है ---
      setMessage(result.error || result.success || null);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">पूरा नाम</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "सेव हो रहा है..." : "नाम सेव करें"}
      </Button>
      {message && <p className={`text-sm mt-2 ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
    </form>
  );
}