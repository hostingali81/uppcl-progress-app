// src/app/admin/settings/SyncButton.tsx
"use client";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { useState, useTransition } from "react";
import { syncWithGoogleSheet } from "./actions";
import { FileSpreadsheet, RefreshCw } from "lucide-react";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    console.log('🔵 Sync button clicked!');
    setMessage(null); // Remove old message
    startTransition(async () => {
      console.log('🔵 Starting sync...');
      try {
        const result = await syncWithGoogleSheet();
        console.log('🔵 Sync result:', result);
        if (result?.error) {
          console.error('❌ Sync error:', result.error);
          setMessage(`Error: ${result.error}`);
        } else {
          console.log('✅ Sync success:', result.success);
          setMessage(result.success || "Sync complete!");
        }
      } catch (error) {
        console.error('❌ Sync exception:', error);
        setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-start space-y-4">
      <EnhancedButton
        onClick={handleClick}
        loading={isPending}
        loadingText="Syncing with Google Sheet..."
        className="google-sheet-button"
      >
        <FileSpreadsheet className="google-icon mr-2 h-4 w-4" />
        <RefreshCw className="mr-2 h-4 w-4" />
        Sync with Google Sheet Now
      </EnhancedButton>
      {message && (
        <p className={`text-sm ${message.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}