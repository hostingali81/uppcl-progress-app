"use client";

import { useState } from "react";
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
import { deleteUser } from "@/app/(main)/admin/users/actions";
import { Trash2, AlertTriangle } from "lucide-react";

// Type definition for user data
type UserToDelete = {
  id: string;
  email: string | undefined;
  profile: {
    full_name: string | null;
    role: string;
    value: string | null;
  } | null;
};

export function DeleteUserDialog({ user }: { user: UserToDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      
      const result = await deleteUser(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <EnhancedButton 
          variant="outline" 
          size="sm" 
          className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </EnhancedButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">Delete User</DialogTitle>
              <DialogDescription className="text-slate-600">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Are you sure you want to delete this user?</h4>
            <div className="text-sm text-red-700 space-y-1">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.profile?.full_name || 'N/A'}</p>
              <p><strong>Role:</strong> {user.profile?.role || 'N/A'}</p>
              {user.profile?.value && (
                <p><strong>Value:</strong> {user.profile.value}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will permanently delete the user account and all associated data. 
              This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <EnhancedButton 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </EnhancedButton>
          <EnhancedButton 
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : "Delete User"}
          </EnhancedButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
