/**
 * UploadProgress Component
 * 
 * Displays upload progress with visual feedback and status messages.
 * Shows progress bar, percentage, and file information.
 */

import React from 'react';
import { Upload, Check, X, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  fileSize?: number;
  status?: 'uploading' | 'success' | 'error';
  error?: string;
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  fileSize,
  status = 'uploading',
  error,
  onCancel,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-doge';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-doge';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="animate-pulse" size={20} />;
      case 'success':
        return <Check size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Upload size={20} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Upload complete!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Uploading...';
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              status === 'success' ? 'bg-green-500/20 text-green-500' :
              status === 'error' ? 'bg-red-500/20 text-red-500' :
              'bg-doge/20 text-doge'
            }`}
          >
            {getStatusIcon()}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{fileName}</p>
            <div className="flex items-center gap-2 mt-1">
              {fileSize && (
                <span className="text-gray-500 text-xs">{formatFileSize(fileSize)}</span>
              )}
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-gray-400 text-xs">{getStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Cancel button (only show during upload) */}
        {status === 'uploading' && onCancel && (
          <button
            onClick={onCancel}
            className="ml-2 text-gray-500 hover:text-white transition-colors"
            title="Cancel upload"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          >
            <div className="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-shimmer" />
          </div>
        </div>

        {/* Percentage and status */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs font-mono">
            {Math.round(progress)}%
          </span>
          {error && (
            <span className="text-red-400 text-xs">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
