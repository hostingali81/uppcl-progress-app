"use client";

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface ProfileErrorProps {
  userEmail?: string;
  userId?: string;
  errorMessage?: string;
}

export function ProfileError({ userEmail, userId, errorMessage }: ProfileErrorProps) {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto text-center">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Error</h2>
        <p className="text-slate-600 mb-4">
          There was an error loading your profile: {errorMessage || 'Unknown error occurred'}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

interface ProfileNotFoundProps {
  userEmail?: string;
  userId?: string;
}

export function ProfileNotFound({ userEmail, userId }: ProfileNotFoundProps) {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto text-center">
        <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Setup Required</h2>
        <p className="text-slate-600 mb-4">
          Your profile hasn't been set up yet. Please contact your administrator to create your profile.
        </p>
        <div className="space-y-2 text-sm text-slate-500">
          <p>User ID: {userId}</p>
          <p>Email: {userEmail}</p>
        </div>
      </div>
    </div>
  );
}
