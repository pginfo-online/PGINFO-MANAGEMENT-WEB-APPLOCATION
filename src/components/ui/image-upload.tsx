'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/components/ui/toast';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string, publicId?: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label = 'Upload Room Photo',
  className = '',
  aspectRatio = 'wide',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Please choose an image under 5MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file format', 'Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const res = await apiClient.upload<{
        images?: Array<{ url: string; publicId: string }>;
      }>('/upload/images', formData);

      const uploadedImage = res.data?.images?.[0];
      if (uploadedImage?.url) {
        onChange(uploadedImage.url, uploadedImage.publicId);
        toast.success('Photo uploaded successfully');
      } else {
        throw new Error('Image URL was not returned by server');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      toast.error('Upload Failed', message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : 'aspect-[16/9] sm:aspect-[21/9]';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload-input"
      />

      {value ? (
        <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 group ${aspectClass}`}>
          <Image
            src={value}
            alt="Uploaded Photo"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-slate-800 transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Change
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600/90 border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-rose-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
              <span className="text-xs font-medium text-slate-200">Uploading new photo...</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/40 p-6 text-center cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-slate-900/70 group ${aspectClass}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-medium text-slate-300">Uploading photo to Cloudinary...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Click to browse or drop photo
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
