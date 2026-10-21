import React, { useState, useEffect } from 'react';
import { UserProfile } from '../lib/types';
import { dbService } from '../lib/databaseService';
import { calculateAge } from '../lib/utils';
import { Heart, Sparkles, Lock, Zap } from 'lucide-react';

interface LikesPageProps {
  currentUser: UserProfile;
  isPremium?: boolean;
  onOpenPremium: () => void;
  onMatchCreated: (candidate: UserProfile) => void;
}

export const LikesPage: React.FC<LikesPageProps> = ({
  currentUser,
  isPremium = false,
  onOpenPremium,
  onMatchCreated,
}) => {
  const [likers, setLikers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikers = async () => {
      try {
        const users = await dbService.getWhoLikedMe(currentUser.id);
        setLikers(users);
      } catch (err) {
        console.error('Failed to fetch likers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLikers();
  }, [currentUser.id]);

  const handleLikeBack = async (targetUser: UserProfile) => {
    try {
      const res = await dbService.recordInteraction(currentUser.id, targetUser.id, 'like');
      if (res.matched) {
        onMatchCreated(targetUser);
      }
      setLikers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err: any) {
      alert(`Error liking back: ${err.message}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black font-display text-white">Likes You</h2>
          <p className="text-xs text-slate-400">
            {likers.length} {likers.length === 1 ? 'person' : 'people'} liked your profile
          </p>
        </div>

        {!isPremium && (
          <button
            onClick={onOpenPremium}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <Sparkles size={13} />
            <span>Unlock All</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading admirers...</div>
      ) : likers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white my-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Heart size={26} />
          </div>
          <h3 className="font-bold text-sm text-white">No Likes Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Make sure your profile has 2+ photos and a thoughtful bio to attract more likes on Discover!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {likers.map((user) => {
            const age = calculateAge(user.birth_date);
            const photo = user.photos?.[0] || '';

            return (
              <div
                key={user.id}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-900 border border-slate-800 shadow-lg group"
              >
                {/* Photo (Blurred if free tier, clear if premium) */}
                <img
                  src={photo}
                  alt={user.display_name}
                  className={`w-full h-full object-cover ${
                    isPremium ? '' : 'blur-xl scale-110 brightness-75'
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Free tier lock state */}
                {!isPremium ? (
                  <div
                    onClick={onOpenPremium}
                    className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-black/40 hover:bg-black/50 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mb-1.5 shadow-lg">
                      <Lock size={18} />
                    </div>
                    <span className="text-xs font-bold text-white">Someone Liked You</span>
                    <span className="text-[10px] text-amber-300 mt-0.5">
                      Tap to reveal with Premium
                    </span>
                  </div>
                ) : (
                  /* Premium tier direct like back control */
                  <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between text-white">
                    <div>
                      <div className="font-bold text-sm leading-tight">{user.display_name}</div>
                      <div className="text-[11px] text-rose-300">{age} yrs</div>
                    </div>
                    <button
                      onClick={() => handleLikeBack(user)}
                      className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition hover:brightness-110"
                      title="Match Back"
                    >
                      <Heart size={16} className="fill-white" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
