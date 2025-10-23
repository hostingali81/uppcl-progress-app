// src/components/custom/EditUserDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUser } from "@/app/(main)/admin/users/actions";
import { Edit } from "lucide-react";

// Type definition for user data
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
    formData.append('id', user.id); // Add ID to tell the action

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
        <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            {/* --- Updated here --- */}
            <DialogTitle className="text-xl font-semibold text-slate-900">Edit User</DialogTitle>
            <DialogDescription className="text-slate-600">{user.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right font-medium text-slate-700">Full Name</Label>
              <Input 
                id="full_name" 
                name="full_name" 
                defaultValue={user.profile?.full_name || ''} 
                className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right font-medium text-slate-700">Role</Label>
              <Select name="role" defaultValue={user.profile?.role} required>
                <SelectTrigger className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent 
                  className="z-[100] bg-white border-slate-200 shadow-lg"
                  position="item-aligned"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                >
                  <SelectItem value="je" className="bg-white hover:bg-slate-50">JE</SelectItem>
                  <SelectItem value="sub_division_head" className="bg-white hover:bg-slate-50">Sub-Division Head</SelectItem>
                  <SelectItem value="division_head" className="bg-white hover:bg-slate-50">Division Head</SelectItem>
                  <SelectItem value="circle_head" className="bg-white hover:bg-slate-50">Circle Head</SelectItem>
                  <SelectItem value="zone_head" className="bg-white hover:bg-slate-50">Zone Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right font-medium text-slate-700">Value</Label>
              <Input 
                id="value" 
                name="value" 
                defaultValue={user.profile?.value || ''} 
                placeholder="e.g., ECD AGRA" 
                className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
          <DialogFooter>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}