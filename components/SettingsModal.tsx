
import React, { useState } from 'react';
import { X, User, Settings, Volume2, VolumeX, Zap, Upload, Loader2, Image as ImageIcon, Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import backendService from '../services/backendService';
import { UploadProgress } from './UploadProgress';
import { ModalPortal } from './ModalPortal';

// ============================================================================
// File Validation Utilities
// ============================================================================

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal characters and special characters
  const sanitized = filename
    .replace(/\.\.+/g, '') // Remove path traversal sequences (.., ..., etc.)
    .replace(/[\/\\~]/g, '') // Remove path separators and tilde
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
  
  return sanitized || 'image';
}

/**
 * Validate file signature (magic numbers) to detect actual file type
 */
export async function validateFileSignature(file: File): Promise<{ valid: boolean; detectedType?: string; error?: string }> {
  // Read file as ArrayBuffer
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
  const uint8Array = new Uint8Array(buffer);
  
  // Magic numbers for common image formats
  const magicNumbers = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'image/bmp': [0x42, 0x4D],
  };
  
  // Check each magic number pattern
  for (const [mimeType, magic] of Object.entries(magicNumbers)) {
    let matches = true;
    for (let i = 0; i < magic.length; i++) {
      if (uint8Array[i] !== magic[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { valid: true, detectedType: mimeType };
    }
  }
  
  return {
    valid: false,
    error: 'File signature does not match a valid image format. Please ensure you are uploading a valid image file (JPEG, PNG, GIF, WebP, or BMP).'
  };
}

/**
 * Parse backend error response to extract specific validation failure details
 */
export function parseBackendError(error: unknown): string {
  if (error instanceof Error) {
    // Try to parse error message from backend response
    const message = error.message;
    
    // Check for specific error patterns
    if (message.includes('Security validation failed')) {
      return 'Security validation failed. The file may contain invalid content or suspicious patterns.';
    }
    if (message.includes('Invalid file signature')) {
      return 'File signature mismatch. The file type does not match its declared type.';
    }
    if (message.includes('Invalid file type')) {
      return 'Invalid file type. Please upload a valid image file (JPEG, PNG, GIF, WebP, or BMP).';
    }
    if (message.includes('File size exceeds')) {
      return 'File size exceeds maximum limit. Please upload a smaller image (max 5MB).';
    }
    if (message.includes('Invalid image dimensions')) {
      return 'Invalid image dimensions. Please ensure your image meets the size requirements.';
    }
    if (message.includes('Invalid aspect ratio')) {
      return 'Invalid aspect ratio. Please ensure your image has a reasonable aspect ratio.';
    }
    
    // Return the original error message if no pattern matches
    return message;
  }
  
  return 'An unexpected error occurred during upload. Please try again.';
}

/**
 * Get user-friendly file requirements message
 */
export function getFileRequirements(): string {
  return 'Requirements: JPEG, PNG, GIF, WebP, or BMP format. Max 5MB.';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateProfile, settings, updateSettings } = useStore();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  
  // Local state for profile form
  const [formProfile, setFormProfile] = useState(userProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
     updateProfile(formProfile);
     playSound('success');
     addToast('success', 'Profile updated successfully!');
     onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      
      // Sanitize filename before processing
      const sanitizedFilename = sanitizeFilename(file.name);
      
      // Create a new File object with sanitized filename
      const sanitizedFile = new File([file], sanitizedFilename, {
        type: file.type,
        lastModified: file.lastModified,
      });
      
      await processImage(sanitizedFile);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      
      // Sanitize filename before processing
      const sanitizedFilename = sanitizeFilename(file.name);
      
      // Create a new File object with sanitized filename
      const sanitizedFile = new File([file], sanitizedFilename, {
        type: file.type,
        lastModified: file.lastModified,
      });
      
      await processImage(sanitizedFile);
    }
  };

  const processImage = async (file: File) => {
    // Step 1: Validate file type (MIME type check)
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file (JPEG, PNG, GIF, WebP, or BMP).';
      setUploadStatus('error');
      setUploadError(errorMsg);
      addToast('error', errorMsg);
      return;
    }

    // Step 2: Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = 'Image size must be less than 5MB.';
      setUploadStatus('error');
      setUploadError(errorMsg);
      addToast('error', errorMsg);
      return;
    }

    // Step 3: Validate file signature (magic numbers)
    const signatureValidation = await validateFileSignature(file);
    if (!signatureValidation.valid) {
      const errorMsg = signatureValidation.error || 'Invalid image file format.';
      setUploadStatus('error');
      setUploadError(errorMsg);
      addToast('error', errorMsg);
      return;
    }

    // Step 4: Check for MIME type mismatch
    if (signatureValidation.detectedType && signatureValidation.detectedType !== file.type) {
      const errorMsg = `File type mismatch. Declared: ${file.type}, Detected: ${signatureValidation.detectedType}. Please use a valid image file.`;
      setUploadStatus('error');
      setUploadError(errorMsg);
      addToast('error', errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadError(null);
    playSound('click');

    try {
      // Upload to backend
      const response = await backendService.uploadImage(
        file,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // DIAGNOSTIC LOGGING
      console.log('[SettingsModal] Upload response:', response);
      console.log('[SettingsModal] Response image:', response.image);
      console.log('[SettingsModal] Image ID:', response.image?.id);
      console.log('[SettingsModal] Image URL:', response.image?.url);
      console.log('[SettingsModal] VITE_API_URL:', import.meta.env.VITE_API_URL);

      if (response.success && response.image) {
        // Construct complete URL from relative path
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const fullUrl = response.image.url.startsWith('http')
          ? response.image.url
          : `${baseUrl}${response.image.url}`;
        
        // DIAGNOSTIC LOGGING
        console.log('[SettingsModal] Base URL:', baseUrl);
        console.log('[SettingsModal] Constructed full URL:', fullUrl);
        console.log('[SettingsModal] Checking for double /api/:', fullUrl.includes('/api/api/'));
        
        // Update profile with the complete URL
        setFormProfile(prev => ({ ...prev, avatarUrl: fullUrl }));
        setUploadStatus('success');
        addToast('success', 'Avatar uploaded successfully!');
        playSound('success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      
      // Parse backend error to get specific validation failure details
      const errorMessage = parseBackendError(error);
      
      setUploadStatus('error');
      setUploadError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-white font-comic">Settings</h2>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
           >
              <User size={16} /> Profile
           </button>
           <button 
             onClick={() => setActiveTab('preferences')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'preferences' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
           >
              <Settings size={16} /> Preferences
           </button>
        </div>

        {activeTab === 'profile' ? (
           <div className="space-y-4">
              <div className="space-y-2">
                 <label htmlFor="settings-avatar" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avatar</label>
                 <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0 relative group">
                       {formProfile.avatarUrl ? (
                          <img src={formProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                             <User size={32} />
                          </div>
                       )}
                       {isUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                             <Loader2 className="animate-spin text-doge" size={24} />
                          </div>
                       )}
                    </div>

                    <div className="flex-1">
                       <div
                         role="button"
                         tabIndex={0}
                         className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer ${isDragOver ? 'border-doge bg-doge/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                         onDragOver={(e) => {
                           e.preventDefault();
                           setIsDragOver(true);
                         }}
                         onDragLeave={() => setIsDragOver(false)}
                         onDrop={handleDrop}
                       >
                          <input
                            id="settings-avatar"
                            name="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload size={20} className="text-gray-400 mb-2" />
                          <p className="text-xs text-gray-400 font-bold text-center mb-1">
                            Click or Drag Image
                          </p>
                          <p className="text-[10px] text-gray-500 text-center">
                            {getFileRequirements()}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Upload Progress Indicator */}
                 {isUploading && (
                   <UploadProgress
                     progress={uploadProgress}
                     fileName="Avatar"
                     status={uploadStatus}
                     error={uploadError || undefined}
                   />
                 )}
              </div>

              <div className="space-y-2">
                 <label htmlFor="settings-username" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                 <input
                   id="settings-username"
                   name="username"
                   type="text"
                   autoComplete="username"
                   value={formProfile.username}
                   onChange={(e) => setFormProfile({...formProfile, username: e.target.value})}
                   className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-doge/50 outline-none transition-all focus:shadow-[0_0_20px_rgba(147,51,234,0.1)]"
                   placeholder="DogeTrader123"
                 />
              </div>
              <div className="space-y-2">
                 <label htmlFor="settings-bio" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
                 <textarea
                   id="settings-bio"
                   name="bio"
                   value={formProfile.bio}
                   onChange={(e) => setFormProfile({...formProfile, bio: e.target.value})}
                   className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-doge/50 outline-none h-24 resize-none transition-all focus:shadow-[0_0_20px_rgba(147,51,234,0.1)]"
                   placeholder="Diamond hands only..."
                 />
              </div>
              
              <Button
                onClick={handleSaveProfile}
                className="w-full rounded-xl mt-2 h-12"
                isLoading={isUploading}
              >
                Save Profile
              </Button>
           </div>
        ) : (
           <div className="space-y-6">
              <div className="space-y-3">
                 <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default Slippage</div>
                 <div className="grid grid-cols-4 gap-2">
                    {['0.5', '1', '2', '5'].map(val => (
                       <button
                         key={val}
                         onClick={() => { updateSettings({ slippage: val }); playSound('click'); }}
                         className={`py-3 rounded-xl text-xs font-bold border transition-all ${settings.slippage === val ? 'bg-doge border-doge text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                       >
                          {val}%
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Interface</div>
                 
                 <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                       <Zap size={20} className={settings.fastMode ? 'text-doge' : 'text-gray-500'} />
                       <div>
                          <div className="text-sm font-bold text-white">Fast Mode</div>
                          <div className="text-[10px] text-gray-500">Skip transaction delays</div>
                       </div>
                    </div>
                    <button 
                       onClick={() => updateSettings({ fastMode: !settings.fastMode })}
                       className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.fastMode ? 'bg-doge' : 'bg-white/10'}`}
                    >
                       <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.fastMode ? 'translate-x-5' : ''}`}></div>
                    </button>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                       {settings.audioEnabled ? <Volume2 size={20} className="text-doge"/> : <VolumeX size={20} className="text-gray-500"/>}
                       <div>
                          <div className="text-sm font-bold text-white">Sound Effects</div>
                          <div className="text-[10px] text-gray-500">UI & Trade sounds</div>
                       </div>
                    </div>
                    <button 
                       onClick={() => updateSettings({ audioEnabled: !settings.audioEnabled })}
                       className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.audioEnabled ? 'bg-doge' : 'bg-white/10'}`}
                    >
                       <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.audioEnabled ? 'translate-x-5' : ''}`}></div>
                    </button>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                       {settings.notificationsEnabled ? <Bell size={20} className="text-doge"/> : <BellOff size={20} className="text-gray-500"/>}
                       <div>
                          <div className="text-sm font-bold text-white">Notifications</div>
                          <div className="text-[10px] text-gray-500">Toasts & Popups</div>
                       </div>
                    </div>
                    <button 
                       onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                       className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.notificationsEnabled ? 'bg-doge' : 'bg-white/10'}`}
                    >
                       <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.notificationsEnabled ? 'translate-x-5' : ''}`}></div>
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>

    </div>
    </ModalPortal>
  );
};
