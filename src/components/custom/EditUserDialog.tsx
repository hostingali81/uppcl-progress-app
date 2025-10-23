// src/components/custom/EditUserDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUser, getRoleValues } from "@/app/(main)/admin/users/actions";
import { Edit, Loader2 } from "lucide-react";

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
  const [selectedRole, setSelectedRole] = useState<string>(user.profile?.role || "");
  const [roleValues, setRoleValues] = useState<string[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(user.profile?.value || "");

  // Set initial value when component mounts
  useEffect(() => {
    if (user.profile?.value) {
      setSelectedValue(user.profile.value);
    }
  }, [user.profile?.value]);

  // Fetch role values when role changes
  useEffect(() => {
    if (selectedRole && selectedRole !== 'superadmin') {
      setLoadingValues(true);
      setSelectedValue(""); // Reset value when role changes
      getRoleValues(selectedRole).then((result) => {
        setRoleValues(result.values || []);
        setLoadingValues(false);
      }).catch((error) => {
        console.error("Error fetching role values:", error);
        setRoleValues([]);
        setLoadingValues(false);
      });
    } else {
      setRoleValues([]);
      setSelectedValue("");
    }
  }, [selectedRole]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      // Get form data manually
      const form = event.currentTarget;
      const fullName = (form.querySelector('input[name="full_name"]') as HTMLInputElement)?.value;
      const role = selectedRole;
      const value = selectedValue || "";

      // Validate required fields
      if (!fullName || !role) {
        setError("Missing required fields: full name and role are required");
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("id", user.id);
      formData.append("full_name", fullName);
      formData.append("role", role);
      formData.append("value", value);
      
      const result = await updateUser(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <EnhancedButton variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </EnhancedButton>
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
              <Select name="role" defaultValue={user.profile?.role} required onValueChange={setSelectedRole}>
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
                  <SelectItem value="superadmin" className="bg-white hover:bg-slate-50">Super Admin</SelectItem>
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
              {selectedRole === 'superadmin' ? (
                <Input 
                  id="value" 
                  name="value" 
                  defaultValue={user.profile?.value || ''} 
                  placeholder="Super Admin (no value needed)" 
                  className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  disabled
                />
              ) : selectedRole && roleValues.length > 0 ? (
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent 
                    className="z-[100] bg-white border-slate-200 shadow-lg"
                    position="item-aligned"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                  >
                    {roleValues.map((value) => (
                      <SelectItem key={value} value={value} className="bg-white hover:bg-slate-50">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : loadingValues ? (
                <div className="col-span-3 flex items-center justify-center p-2 border border-slate-200 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-slate-600">Loading values...</span>
                </div>
              ) : selectedRole ? (
                <Input 
                  id="value" 
                  name="value" 
                  defaultValue={user.profile?.value || ''} 
                  placeholder="No values available for this role" 
                  className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  disabled
                />
              ) : (
                <Input 
                  id="value" 
                  name="value" 
                  defaultValue={user.profile?.value || ''} 
                  placeholder="Select a role first" 
                  className="col-span-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  disabled
                />
              )}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
          <DialogFooter>
            <EnhancedButton type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </EnhancedButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}