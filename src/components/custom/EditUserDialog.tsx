// src/components/custom/EditUserDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUser } from "@/app/(main)/admin/users/actions";

// यूज़र डेटा के लिए टाइप परिभाषा
type UserToEdit = {
  id: string;
  email: string | undefined;
  profile: {
    full_name: string | null;
    role: string;
    value: string | null;
  } | null;
};

export function EditUserDialog({ user }: { user: UserToEdit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append('id', user.id); // एक्शन को बताने के लिए ID जोड़ें

    const result = await updateUser(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">एडिट</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            {/* --- यहाँ बदलाव किया गया है --- */}
            <DialogTitle>यूज़र एडिट करें</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">पूरा नाम</Label>
              <Input id="full_name" name="full_name" defaultValue={user.profile?.full_name || ''} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">भूमिका</Label>
              <Select name="role" defaultValue={user.profile?.role} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="एक भूमिका चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="je">JE</SelectItem>
                  <SelectItem value="division_head">Division Head</SelectItem>
                  <SelectItem value="circle_head">Circle Head</SelectItem>
                  <SelectItem value="zone_head">Zone Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">मान (Value)</Label>
              <Input id="value" name="value" defaultValue={user.profile?.value || ''} placeholder="जैसे: ECD AGRA" className="col-span-3" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <DialogFooter>
            <Button type="submit">बदलाव सेव करें</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}