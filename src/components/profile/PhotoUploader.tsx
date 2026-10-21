import React, { useState } from 'react';
import { Camera, Trash2, Upload, AlertCircle } from 'lucide-react';
import { validateImageFile } from '../../lib/utils';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (newPhotos: string[]) => void;
  maxPhotos?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onChange,
  maxPhotos = 4,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file format');
      return;
    }

    setUploading(true);

    try {
      // Read local image data URL for instant zero-latency preview and persistence
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const updated = [...photos, result];
          onChange(updated.slice(0, maxPhotos));
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setErrorMsg('Failed to process image file.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setErrorMsg('Error reading image.');
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300">
          Profile Photos ({photos.length}/{maxPhotos})
        </label>
        <span className="text-[10px] text-slate-400">Max 5MB each (JPEG, PNG, WebP)</span>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        {photos.map((url, idx) => (
          <div
            key={idx}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 group shadow-md"
          >
            <img
              src={url}
              alt={`Profile Photo ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemovePhoto(idx)}
              className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-500 text-white rounded-full transition shadow-lg active:scale-90"
              title="Remove Photo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Upload Trigger Slot */}
        {photos.length < maxPhotos && (
          <label className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-700 hover:border-rose-500/60 bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer flex flex-col items-center justify-center p-4 transition group">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-rose-500/20 text-slate-400 group-hover:text-rose-400 flex items-center justify-center mb-2 transition">
              <Camera size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition">
              {uploading ? 'Processing...' : 'Add Photo'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP</span>
          </label>
        )}
      </div>
    </div>
  );
};
