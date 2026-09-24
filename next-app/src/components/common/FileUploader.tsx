'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

export interface FileUploaderProps {
  accept?: string;
  maxSizeBytes?: number;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = '.pdf,.docx,.zip',
  maxSizeBytes = 50 * 1024 * 1024,
  onFileSelect,
  className,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatedChecksum, setSimulatedChecksum] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > maxSizeBytes) {
      setError(`File size exceeds maximum allowed (${formatFileSize(maxSizeBytes)})`);
      return;
    }

    setSelectedFile(file);
    const mockHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setSimulatedChecksum(mockHash);

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSimulatedChecksum(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200',
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70',
          selectedFile && 'border-emerald-300 bg-emerald-50/30'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              selectedFile
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-indigo-50 text-indigo-600'
            )}
          >
            {selectedFile ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="text-sm">
            <span className="font-semibold text-indigo-600 hover:text-indigo-700">
              Click to upload
            </span>{' '}
            <span className="text-slate-500">or drag and drop</span>
          </div>

          <p className="text-xs text-slate-400">
            PDF, DOCX, ZIP up to {formatFileSize(maxSizeBytes)}
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-left">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg flex-shrink-0">
              <File className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)}
              </p>

              {simulatedChecksum && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-400">SHA-256:</span>
                  <span className="truncate">{simulatedChecksum}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
