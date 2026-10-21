import React from 'react';
import { Heart, Database, Shield, Zap } from 'lucide-react';
import { UserProfile } from '../../lib/types';

interface HeaderProps {
  currentUser: UserProfile;
  isSupabaseConnected: boolean;
  onOpenSupabaseSettings: () => void;
  onOpenSafetyGuidelines: () => void;
  onOpenPremium: () => void;
  isPremium?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isSupabaseConnected,
  onOpenSupabaseSettings,
  onOpenSafetyGuidelines,
  onOpenPremium,
  isPremium,
}) => {
  const remainingLikes = Math.max(0, 20 - currentUser.daily_like_count);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Heart size={16} className="text-white fill-white" />
        </div>
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
          LoveMatch
        </span>
      </div>

      {/* Zone 2: Status & Quick Controls */}
      <div className="flex items-center space-x-2">
        {/* Supabase status badge */}
        <button
          onClick={onOpenSupabaseSettings}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
            isSupabaseConnected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
          }`}
          title="Supabase Backend Config"
        >
          <Database size={13} />
          <span className="hidden sm:inline">
            {isSupabaseConnected ? 'Supabase Live' : 'Supabase Demo'}
          </span>
        </button>

        {/* Daily Likes Counter */}
        {isPremium ? (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-semibold">
            <Zap size={12} className="fill-amber-300" />
            <span>Unlimited</span>
          </div>
        ) : (
          <button
            onClick={onOpenPremium}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-full text-xs font-medium transition"
            title="Likes remaining today"
          >
            <Heart size={12} className="text-rose-400 fill-rose-400" />
            <span className="tabular-nums">{remainingLikes}</span>
            <span className="text-[10px] text-slate-400">left</span>
          </button>
        )}

        {/* Safety Guidelines */}
        <button
          onClick={onOpenSafetyGuidelines}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-full transition hover:bg-slate-800"
          title="Community Guidelines & Safety"
        >
          <Shield size={18} />
        </button>
      </div>
    </header>
  );
};
