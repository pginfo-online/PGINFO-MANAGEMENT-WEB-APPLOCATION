'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AddPropertyForm } from './AddPropertyForm';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (propertyId: string) => void;
}

export function AddPropertyDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddPropertyDialogProps) {
  const handleSuccess = (propertyId: string) => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess(propertyId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span>Add New PG Property</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Set up your property basic details, Google Maps location, and initial room configuration.
          </DialogDescription>
        </DialogHeader>

        <AddPropertyForm
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
