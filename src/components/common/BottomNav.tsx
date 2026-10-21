import React from 'react';
import { Flame, Heart, Sparkles, MessageCircle, User } from 'lucide-react';

export type TabType = 'discover' | 'likes' | 'matches' | 'messages' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  matchesCount?: number;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  matchesCount = 0,
  unreadMessagesCount = 0,
}) => {
  const tabs: { key: TabType; label: string; icon: typeof Flame; badge?: number }[] = [
    { key: 'discover', label: 'Discover', icon: Flame },
    { key: 'likes', label: 'Likes', icon: Heart },
    { key: 'matches', label: 'Matches', icon: Sparkles, badge: matchesCount },
    { key: 'messages', label: 'Messages', icon: MessageCircle, badge: unreadMessagesCount },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-1 flex justify-around items-center z-40 shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChangeTab(tab.key)}
            className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-95 ${
              isActive
                ? 'text-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label={tab.label}
          >
            <div className="relative">
              <Icon
                size={22}
                className={
                  isActive
                    ? 'stroke-[2.5px] fill-rose-500/20 text-rose-400'
                    : 'stroke-2 text-slate-400'
                }
              />
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
