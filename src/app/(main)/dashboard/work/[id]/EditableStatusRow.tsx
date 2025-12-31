"use client";

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { updateWorkStatuses } from './actions';
import { Check, Edit3 } from 'lucide-react';
import { WORK_STATUS_OPTIONS } from '@/lib/constants';

interface EditableStatusRowProps {
  label: string;
  fieldName: 'mb_status' | 'teco_status' | 'fico_status';
  currentValue?: string | null;
  workId: number;
}

interface EditableDetailRowProps {
  label: string;
  fieldName: string;
  currentValue?: string | number | null;
  workId: number;
  suggestions?: string[];
}

export function EditableStatusRow({ label, fieldName, currentValue, workId }: EditableStatusRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string>(currentValue || '');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const options = fieldName === 'mb_status'
    ? WORK_STATUS_OPTIONS.MB_STATUS
    : fieldName === 'teco_status'
    ? WORK_STATUS_OPTIONS.TECO_STATUS
    : WORK_STATUS_OPTIONS.FICO_STATUS;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateWorkStatuses(formData);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        // Apply the new value locally for immediate feedback
        const newVal = (formData.get(fieldName) as string) || (formData.get(fieldName.replace('_', '') as string) as string) || '';
        setValue(newVal);
        setMessage({ type: 'success', text: result.success || 'Updated' });
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 900);
      }
    });
  };

  return (
    <>
      <div
        className={`group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 cursor-pointer`}
        onClick={() => setIsOpen(true)}
      >
        <dt className="text-sm font-medium text-slate-600 flex-shrink-0 min-w-[140px]">{label}</dt>
        <dd className="text-sm text-slate-900 font-medium text-right flex-1 ml-4 hover:text-blue-600 transition-colors duration-200">
          {value || <span className="text-slate-400">Not set</span>}
        </dd>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Edit3 className="h-4 w-4 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold">Edit {label}</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="workId" value={workId} />
            <Label className="text-sm font-medium">{label}</Label>
            <select
              name={fieldName}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">-- Select --</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {message && (
              <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (
                  <><Check className="h-4 w-4 mr-2" /> Save</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Text input version for location and other details
export function EditableDetailRow({ label, fieldName, currentValue, workId, suggestions = [] }: EditableDetailRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string>(String(currentValue || ''));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>(suggestions);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const result = await updateWorkStatuses(formData);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        // Safely read value from the submitted FormData instead of accessing
        // the element directly on the form (which can be null at runtime).
        const newVal = (formData.get(fieldName) as string) || '';
        setValue(newVal);
        setMessage({ type: 'success', text: result.success || 'Updated' });
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 900);
      }
    });
  };

  return (
    <>
      <div
        className={`group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 cursor-pointer`}
        onClick={() => setIsOpen(true)}
      >
        <dt className="text-sm font-medium text-slate-600 flex-shrink-0 min-w-[140px]">{label}</dt>
        <dd className="text-sm text-slate-900 font-medium text-right flex-1 ml-4 hover:text-blue-600 transition-colors duration-200">
          {value || <span className="text-slate-400">N/A</span>}
        </dd>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Edit3 className="h-4 w-4 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold">Edit {label}</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="workId" value={workId} />
            <Label className="text-sm font-medium">{label}</Label>
            <div className="relative">
              <Input
                name={fieldName}
                value={value}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setValue(newValue);
                  if (suggestions.length > 0) {
                    const filtered = suggestions.filter(s => 
                      s.toLowerCase().includes(newValue.toLowerCase())
                    );
                    setFilteredSuggestions(filtered);
                    setShowSuggestions(newValue.length > 0 && filtered.length > 0);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0 && value.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="w-full"
                autoComplete="off"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.slice(0, 10).map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setValue(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (
                  <><Check className="h-4 w-4 mr-2" /> Save</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EditableStatusRow;
