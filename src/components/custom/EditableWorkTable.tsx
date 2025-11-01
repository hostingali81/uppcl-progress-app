"use client";

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, X, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { updateWorkField, deleteWork } from '@/app/(main)/dashboard/actions';
import Link from 'next/link';
import type { Work } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface EditableWorkTableProps {
  works: Work[];
  onUpdate: () => void;
}

export function EditableWorkTable({ works, onUpdate }: EditableWorkTableProps) {
  const [editingCell, setEditingCell] = useState<{ workId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<number | null>(null);

  const handleEdit = (workId: number, field: string, currentValue: any) => {
    setEditingCell({ workId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleSave = (workId: number, field: string) => {
    startTransition(async () => {
      const result = await updateWorkField(workId, field, editValue);
      if (result.success) {
        setEditingCell(null);
        onUpdate();
      } else if (result.error) {
        alert(result.error);
      }
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleDelete = (workId: number) => {
    setWorkToDelete(workId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workToDelete) {
      startTransition(async () => {
        const result = await deleteWork(workToDelete);
        if (result.success) {
          setDeleteDialogOpen(false);
          setWorkToDelete(null);
          onUpdate();
        } else if (result.error) {
          alert(result.error);
        }
      });
    }
  };

  const renderCell = (work: Work, field: keyof Work, type: 'text' | 'number' | 'date' = 'text') => {
    const isEditing = editingCell?.workId === work.id && editingCell?.field === field;
    const value = work[field];

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[150px]">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-xs"
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave(work.id as number, field);
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button 
            onClick={() => handleSave(work.id as number, field)} 
            disabled={isPending} 
            className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button 
            onClick={handleCancel} 
            disabled={isPending} 
            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div 
        className="group flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-slate-100 transition-colors" 
        onClick={() => handleEdit(work.id as number, field, value)}
        title="Click to edit"
      >
        <span className="text-xs sm:text-sm truncate max-w-[200px]">{value || 'N/A'}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 flex-shrink-0" />
      </div>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="min-w-[250px] font-semibold">Work Name</TableHead>
              <TableHead className="min-w-[120px] font-semibold">District</TableHead>
              <TableHead className="min-w-[120px] font-semibold">Zone</TableHead>
              <TableHead className="min-w-[120px] font-semibold">Circle</TableHead>
              <TableHead className="min-w-[120px] font-semibold">Division</TableHead>
              <TableHead className="min-w-[120px] font-semibold">Sub Division</TableHead>
              <TableHead className="min-w-[120px] font-semibold">JE Name</TableHead>
              <TableHead className="min-w-[120px] font-semibold">Category</TableHead>
              <TableHead className="min-w-[100px] font-semibold">WBS Code</TableHead>
              <TableHead className="min-w-[100px] font-semibold">Progress %</TableHead>
              <TableHead className="min-w-[150px] font-semibold">Remark</TableHead>
              <TableHead className="min-w-[120px] font-semibold">MB Status</TableHead>
              <TableHead className="min-w-[120px] font-semibold">TECO Status</TableHead>
              <TableHead className="min-w-[120px] font-semibold">FICO Status</TableHead>
              <TableHead className="min-w-[100px] font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {works.map((work) => (
              <TableRow key={work.id} className="hover:bg-slate-50 border-b">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {work.is_blocked && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" title="Blocked" />}
                    <Link 
                      href={`/dashboard/work/${work.id}`} 
                      className="text-blue-600 hover:underline text-xs sm:text-sm flex items-center gap-1"
                      title="View details"
                    >
                      {work.work_name || 'No name'}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{renderCell(work, 'district_name')}</TableCell>
                <TableCell>{renderCell(work, 'civil_zone')}</TableCell>
                <TableCell>{renderCell(work, 'civil_circle')}</TableCell>
                <TableCell>{renderCell(work, 'civil_division')}</TableCell>
                <TableCell>{renderCell(work, 'civil_sub_division')}</TableCell>
                <TableCell>{renderCell(work, 'je_name')}</TableCell>
                <TableCell>{renderCell(work, 'work_category')}</TableCell>
                <TableCell>{renderCell(work, 'wbs_code')}</TableCell>
                <TableCell>{renderCell(work, 'progress_percentage', 'number')}</TableCell>
                <TableCell>{renderCell(work, 'remark')}</TableCell>
                <TableCell>{renderCell(work, 'mb_status')}</TableCell>
                <TableCell>{renderCell(work, 'teco_status')}</TableCell>
                <TableCell>{renderCell(work, 'fico_status')}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(work.id as number)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      title="Delete work"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this work? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
