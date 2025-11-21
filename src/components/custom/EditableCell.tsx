"use client";

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Edit2, Calendar as CalendarIcon } from 'lucide-react';
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

  const handleDateChange = (newDate: string) => {
    setEditValue(newDate);
  };

  const formatDisplayValue = (val: string | number | null) => {
    if (!val) return 'N/A';
    
    if (type === 'date') {
      try {
        // Handle different date formats
        let date: Date;
        if (typeof val === 'string') {
          // Try parsing common date formats
          if (val.includes('T')) {
            // ISO format
            date = new Date(val);
          } else {
            // YYYY-MM-DD format
            date = new Date(val + 'T00:00:00');
          }
        } else {
          // Timestamp number
          date = new Date(val);
        }
        
        // Format using native JavaScript
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      } catch (error) {
        return val.toString();
      }
    }
    
    return val.toString();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {type === 'date' ? (
          <div className="relative flex-1">
            <Input
              type="date"
              value={editValue}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-7 text-xs pr-8"
              autoFocus
              disabled={isPending}
              max="9999-12-31"
            />
            <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        ) : (
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-7 text-xs"
            autoFocus
            disabled={isPending}
          />
        )}
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
      <span className="text-xs sm:text-sm">{formatDisplayValue(value)}</span>
      {type === 'date' && (
        <CalendarIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
      )}
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
    </div>
  );
}
