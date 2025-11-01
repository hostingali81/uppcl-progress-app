"use client";

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Edit2 } from 'lucide-react';
import { updateWorkField } from '@/app/(main)/dashboard/actions';

interface EditableCellProps {
  workId: number;
  fieldName: string;
  value: string | number | null;
  type?: 'text' | 'number' | 'date';
  onUpdate?: () => void;
}

export function EditableCell({ workId, fieldName, value, type = 'text', onUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateWorkField(workId, fieldName, editValue);
      if (result.success) {
        setIsEditing(false);
        onUpdate?.();
      }
    });
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-xs"
          autoFocus
          disabled={isPending}
        />
        <button onClick={handleSave} disabled={isPending} className="text-green-600 hover:text-green-700">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={handleCancel} disabled={isPending} className="text-red-600 hover:text-red-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
      <span className="text-xs sm:text-sm">{value || 'N/A'}</span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
    </div>
  );
}
