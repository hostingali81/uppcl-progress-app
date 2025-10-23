// src/components/custom/UpdateProfileForm.tsx
"use client";
import { updateProfile } from "@/app/(main)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransition, useState } from "react";
import { Save } from "lucide-react";

export function UpdateProfileForm({ fullName }: { fullName: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    
    startTransition(async () => {
      const result = await updateProfile(fullName);
      setMessage(result.error || (result.success ? "Profile updated successfully!" : null));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</Label>
        <Input 
          id="fullName" 
          name="fullName" 
          defaultValue={fullName} 
          required 
          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        <Save className="h-4 w-4 mr-2" />
        {isPending ? "Saving..." : "Save Name"}
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