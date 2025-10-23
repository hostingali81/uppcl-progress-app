// src/app/admin/settings/SyncButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { syncWithGoogleSheet } from "./actions";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null); // Remove old message
    startTransition(async () => {
      const result = await syncWithGoogleSheet();
      if (result?.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        setMessage(result.success || "Sync complete!");
      }
    });
  };

  return (
    <div className="flex flex-col items-start space-y-4">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Syncing..." : "Sync with Google Sheet Now"}
      </Button>
      {message && (
        <p className={`text-sm ${message.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}