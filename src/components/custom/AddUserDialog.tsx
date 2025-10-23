// src/components/custom/AddUserDialog.tsx
"use client"; // This is a client component because it has state and interactions

import { useState, useEffect } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";

// Import the server action here (we'll create this in the next step)
import { addUser, getRoleValues } from "@/app/(main)/admin/users/actions";

export function AddUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleValues, setRoleValues] = useState<string[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>("");

  // Fetch role values when role changes
  useEffect(() => {
    if (selectedRole && selectedRole !== 'superadmin') {
      setLoadingValues(true);
      setSelectedValue(""); // Reset selected value when role changes
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
      const email = (form.querySelector('#add-email') as HTMLInputElement)?.value;
      const password = (form.querySelector('#add-password') as HTMLInputElement)?.value;
      const fullName = (form.querySelector('#add-full_name') as HTMLInputElement)?.value;
      const role = selectedRole;
      const value = selectedValue || "";

      // Validate required fields
      if (!email || !password || !fullName || !role) {
        setError("Missing required fields: email, password, full name, and role are required");
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("full_name", fullName);
      formData.append("role", role);
      formData.append("value", value);
      
      const result = await addUser(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        form.reset();
        setSelectedRole("");
        setRoleValues([]);
        setSelectedValue("");
      }
    } catch (error) {
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <EnhancedButton className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </EnhancedButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-visible p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Create New User</DialogTitle>
            <DialogDescription className="text-slate-600">
              Enter user information here. They will be given a temporary password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-full_name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</Label>
              <Input 
                id="add-full_name" 
                name="full_name" 
                className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="add-email" className="block text-sm font-medium text-slate-700 mb-1">Email</Label>
              <Input 
                id="add-email" 
                name="email" 
                type="email" 
                className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="add-password" className="block text-sm font-medium text-slate-700 mb-1">Password</Label>
              <Input 
                id="add-password" 
                name="password" 
                type="password" 
                className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="add-role" className="block text-sm font-medium text-slate-700 mb-1">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="add-role" className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500">
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
            <div>
              <Label htmlFor="add-value" className="block text-sm font-medium text-slate-700 mb-1">Value</Label>
              {selectedRole === 'superadmin' ? (
                <Input 
                  id="add-value" 
                  name="value" 
                  placeholder="Super Admin (no value needed)" 
                  className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  disabled
                  value=""
                />
              ) : selectedRole && roleValues.length > 0 ? (
                  <Select value={selectedValue} onValueChange={setSelectedValue}>
                    <SelectTrigger id="add-value" className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500">
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
                <div className="w-full flex items-center justify-center p-2 border border-slate-200 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-slate-600">Loading values...</span>
                </div>
              ) : selectedRole ? (
                <Input 
                  id="add-value" 
                  name="value" 
                  placeholder="No values available for this role" 
                  className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  disabled
                  value=""
                />
              ) : (
                <Input 
                  id="add-value" 
                  name="value" 
                  placeholder="Select a role first" 
                  className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  disabled
                  value=""
                />
              )}
            </div>
          </div>
           {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
          <DialogFooter>
            <EnhancedButton type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save User
            </EnhancedButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}