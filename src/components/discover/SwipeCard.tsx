import React, { useState, useRef } from 'react';
import { UserProfile } from '../../lib/types';
import { calculateAge } from '../../lib/utils';
import { MapPin, Heart, X, ShieldAlert, Sparkles, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface SwipeCardProps {
  candidate: UserProfile;
  onLike: () => void;
  onPass: () => void;
  onReport: () => void;
  onRewind?: () => void;
  canRewind?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  candidate,
  onLike,
  onPass,
  onReport,
  onRewind,
  canRewind = false,
}) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const age = calculateAge(candidate.birth_date);
  const photoUrl = candidate.photos?.[0] || '';

  // Pointer drag events for smooth mobile and desktop swipe gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from upper card area, not from button controls
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy * 0.4 });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const threshold = 100;
    if (dragOffset.x > threshold) {
      onLike();
    } else if (dragOffset.x < -threshold) {
      onPass();
    }
    setDragOffset({ x: 0, y: 0 });
  };

  const rotation = dragOffset.x * 0.08;
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / 80));
  const passOpacity = Math.min(1, Math.max(0, -dragOffset.x / 80));

  return (
    <div className="relative w-full max-w-sm h-[580px] sm:h-[620px] select-none flex flex-col justify-end">
      {/* Swipeable Card Surface */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 touch-none cursor-grab active:cursor-grabbing"
      >
        {/* Background Portrait Photo */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={candidate.display_name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <Sparkles size={36} />
            </div>
            <h3 className="text-xl font-bold text-white">{candidate.display_name}</h3>
            <p className="text-xs text-slate-400 mt-1">Photo uploading...</p>
          </div>
        )}

        {/* Dynamic Drag Decision Stamp Overlays */}
        <div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-8 z-30 pointer-events-none border-4 border-emerald-400 text-emerald-400 px-4 py-1.5 rounded-2xl font-black text-2xl tracking-wider rotate-[-15deg] bg-black/30 backdrop-blur-sm"
        >
          LIKE
        </div>

        <div
          style={{ opacity: passOpacity }}
          className="absolute top-8 right-8 z-30 pointer-events-none border-4 border-rose-500 text-rose-500 px-4 py-1.5 rounded-2xl font-black text-2xl tracking-wider rotate-[15deg] bg-black/30 backdrop-blur-sm"
        >
          PASS
        </div>

        {/* Ambient Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Safety Report Flag */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-rose-400 active:scale-90 flex items-center justify-center transition"
          title="Safety Report"
          aria-label="Report Profile"
        >
          <ShieldAlert size={18} />
        </button>

        {/* Profile Details Panel (Bottom Section) */}
        <div className="relative z-10 p-5 text-white">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-2xl font-extrabold tracking-tight font-display">
              {candidate.display_name}
            </h2>
            <span className="text-xl font-light text-rose-300">{age}</span>
          </div>

          {candidate.city && (
            <div className="flex items-center text-xs text-slate-300 mt-1">
              <MapPin size={13} className="mr-1 text-rose-400 shrink-0" />
              <span>{candidate.city}</span>
            </div>
          )}

          {/* Bio text with expandable view */}
          {candidate.bio && (
            <div className="mt-2.5">
              <p
                className={`text-xs text-slate-200 leading-relaxed ${
                  showFullBio ? '' : 'line-clamp-2'
                }`}
              >
                {candidate.bio}
              </p>
              {candidate.bio.length > 80 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullBio(!showFullBio);
                  }}
                  className="text-[11px] font-semibold text-rose-300 mt-0.5 flex items-center space-x-0.5 hover:underline"
                >
                  <span>{showFullBio ? 'Show less' : 'Read more'}</span>
                  {showFullBio ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          )}

          {/* Interests tags */}
          {candidate.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {candidate.interests.slice(0, 4).map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-white/15 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-100"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Tactile Action Controls (Bottom thumb area) */}
          <div className="flex items-center justify-center space-x-4 mt-5">
            {canRewind && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRewind?.();
                }}
                className="w-12 h-12 rounded-full bg-slate-800/90 border border-slate-700 text-amber-400 active:scale-90 flex items-center justify-center transition shadow-lg hover:bg-slate-700"
                title="Rewind last pass (Premium)"
                aria-label="Rewind"
              >
                <RotateCcw size={18} />
              </button>
            )}

            {/* Pass Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPass();
              }}
              className="w-14 h-14 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 active:scale-90 flex items-center justify-center transition shadow-xl"
              title="Pass"
              aria-label="Pass"
            >
              <X size={26} strokeWidth={2.5} />
            </button>

            {/* Like Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 text-white active:scale-95 flex items-center justify-center transition shadow-xl shadow-rose-500/30 hover:brightness-110"
              title="Like"
              aria-label="Like"
            >
              <Heart size={30} className="fill-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
