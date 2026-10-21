import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../lib/types';
import { dbService } from '../lib/databaseService';
import { SwipeCard } from '../components/discover/SwipeCard';
import { MatchCelebrationModal } from '../components/discover/MatchCelebrationModal';
import { SlidersHorizontal, RefreshCw, Flame, Sparkles, X } from 'lucide-react';

interface DiscoverPageProps {
  currentUser: UserProfile;
  isPremium?: boolean;
  onOpenChat: (candidate: UserProfile) => void;
  onReportUser: (userId: string) => void;
  onOpenPremium: () => void;
  onProfileUpdated: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  currentUser,
  isPremium = false,
  onOpenChat,
  onReportUser,
  onOpenPremium,
  onProfileUpdated,
}) => {
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [minAge, setMinAge] = useState(currentUser.min_age_pref || 18);
  const [maxAge, setMaxAge] = useState(currentUser.max_age_pref || 40);
  const [matchedCandidate, setMatchedCandidate] = useState<UserProfile | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await dbService.getDiscoveryFeed(currentUser.id, {
        minAge,
        maxAge,
      });
      setCandidates(feed);
    } catch (err) {
      console.error('Failed to load discovery feed:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, minAge, maxAge]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleInteraction = async (action: 'like' | 'pass') => {
    if (candidates.length === 0) return;
    const candidate = candidates[0];

    try {
      const result = await dbService.recordInteraction(currentUser.id, candidate.id, action);

      if (!result.success && result.error === 'DAILY_LIMIT_REACHED') {
        alert(result.message);
        onOpenPremium();
        return;
      }

      // Pop from queue
      setCandidates((prev) => prev.slice(1));
      onProfileUpdated();

      if (result.matched) {
        setMatchedCandidate(candidate);
      }
    } catch (err: any) {
      alert(`Interaction error: ${err.message}`);
    }
  };

  const handleRewind = async () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }

    try {
      const rewound = await dbService.rewindLastPass(currentUser.id);
      if (rewound) {
        setCandidates((prev) => [rewound, ...prev]);
      } else {
        alert('No recent passes to rewind.');
      }
    } catch (err: any) {
      alert(`Could not rewind: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-2 relative">
      {/* Feed Filter Trigger Bar */}
      <div className="w-full max-w-sm flex items-center justify-between py-1 mb-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Flame size={15} className="text-rose-400" />
          <span>Radar: {minAge}–{maxAge} yrs</span>
        </div>

        <button
          onClick={() => setShowFiltersModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-medium transition"
        >
          <SlidersHorizontal size={13} />
          <span>Preferences</span>
        </button>
      </div>

      {/* Main Discover Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 text-xs">
          <div className="animate-spin w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full mb-3" />
          <span>Scanning verified members nearby...</span>
        </div>
      ) : candidates.length > 0 ? (
        <SwipeCard
          candidate={candidates[0]}
          onLike={() => handleInteraction('like')}
          onPass={() => handleInteraction('pass')}
          onReport={() => onReportUser(candidates[0].id)}
          onRewind={handleRewind}
          canRewind={true}
        />
      ) : (
        <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center text-white my-10 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={28} />
          </div>
          <h3 className="text-xl font-black font-display text-white">All Caught Up!</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            You've seen all available adult profiles matching your current age and gender filters.
          </p>

          <div className="mt-6 space-y-2">
            <button
              onClick={fetchCandidates}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 flex items-center justify-center space-x-2 transition hover:brightness-110 active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Refresh Radar</span>
            </button>
            <button
              onClick={() => setShowFiltersModal(true)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              Expand Search Range
            </button>
          </div>
        </div>
      )}

      {/* Match Celebration Dialog */}
      {matchedCandidate && (
        <MatchCelebrationModal
          currentUser={currentUser}
          matchedCandidate={matchedCandidate}
          onOpenChat={() => {
            const partner = matchedCandidate;
            setMatchedCandidate(null);
            onOpenChat(partner);
          }}
          onContinue={() => setMatchedCandidate(null)}
        />
      )}

      {/* Discovery Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowFiltersModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X size={16} />
            </button>

            <h3 className="font-bold text-base mb-4 flex items-center space-x-2">
              <SlidersHorizontal size={18} className="text-rose-400" />
              <span>Discovery Filters</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Min Age (18+)</span>
                  <span className="font-bold text-rose-400">{minAge} yrs</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Max Age</span>
                  <span className="font-bold text-rose-400">{maxAge} yrs</span>
                </div>
                <input
                  type="range"
                  min={minAge}
                  max={80}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <button
                onClick={() => {
                  setShowFiltersModal(false);
                  fetchCandidates();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl text-xs transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
