import React, { useState, useEffect } from 'react';
import { MatchItem, UserProfile } from '../lib/types';
import { dbService } from '../lib/databaseService';
import { calculateAge, formatTimeAgo } from '../lib/utils';
import { Sparkles, MessageCircle, Heart, UserMinus } from 'lucide-react';

interface MatchesPageProps {
  currentUser: UserProfile;
  onSelectMatch: (match: MatchItem) => void;
  onGoDiscover: () => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({
  currentUser,
  onSelectMatch,
  onGoDiscover,
}) => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const list = await dbService.getMatches(currentUser.id);
        setMatches(list);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [currentUser.id]);

  return (
    <div className="w-full max-w-md mx-auto p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black font-display text-white">Mutual Matches</h2>
          <p className="text-xs text-slate-400">
            {matches.length} {matches.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">
          Loading your connections...
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white my-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={26} />
          </div>
          <h3 className="font-bold text-sm text-white">No Mutual Matches Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            When you and another member like each other on Discover, they will appear here and you can chat freely!
          </p>
          <button
            onClick={onGoDiscover}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition"
          >
            Start Swiping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {matches.map((item) => {
            const partner = item.matched_user;
            const age = calculateAge(partner.birth_date);
            const photo = partner.photos?.[0] || '';

            return (
              <div
                key={item.match_id}
                onClick={() => onSelectMatch(item)}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-900 border border-slate-800 shadow-lg cursor-pointer hover:border-rose-500/50 transition group"
              >
                <img
                  src={photo}
                  alt={partner.display_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm leading-tight">{partner.display_name}</div>
                      <div className="text-[11px] text-rose-300">{age} yrs · {partner.city || 'Nearby'}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-rose-500/80 text-white flex items-center justify-center shadow-md">
                      <MessageCircle size={15} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
