import React, { useState, useEffect } from 'react';
import { MatchItem, UserProfile } from '../lib/types';
import { dbService } from '../lib/databaseService';
import { calculateAge, formatTimeAgo } from '../../src/lib/utils';
import { MessageCircle, Search, Sparkles } from 'lucide-react';

interface MessagesPageProps {
  currentUser: UserProfile;
  onSelectMatch: (match: MatchItem) => void;
  onGoDiscover: () => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  onSelectMatch,
  onGoDiscover,
}) => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const list = await dbService.getMatches(currentUser.id);
        setMatches(list);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [currentUser.id]);

  const filtered = matches.filter((m) =>
    m.matched_user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-md mx-auto p-4 text-white">
      <div className="mb-4">
        <h2 className="text-xl font-black font-display text-white">Messages</h2>
        <p className="text-xs text-slate-400">Encrypted 1-on-1 conversations</p>
      </div>

      {/* Search Input */}
      {matches.length > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">
          Loading messages...
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white my-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={26} />
          </div>
          <h3 className="font-bold text-sm text-white">No Active Chats</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            You need to match with someone on Discover before you can start messaging.
          </p>
          <button
            onClick={onGoDiscover}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition"
          >
            Find Matches
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const partner = item.matched_user;
            const photo = partner.photos?.[0] || '';
            const age = calculateAge(partner.birth_date);

            return (
              <div
                key={item.match_id}
                onClick={() => onSelectMatch(item)}
                className="p-3 bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-2xl flex items-center space-x-3 cursor-pointer transition active:scale-[0.99] group"
              >
                <div className="relative">
                  {photo ? (
                    <img
                      src={photo}
                      alt={partner.display_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-800 group-hover:ring-rose-500/40 transition"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-900/40 text-rose-300 font-bold flex items-center justify-center text-sm">
                      {partner.display_name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-sm text-white truncate">
                      {partner.display_name}, <span className="font-normal text-slate-400 text-xs">{age}</span>
                    </h4>
                    {item.last_message_time && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTimeAgo(item.last_message_time)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {item.last_message || 'Say hello to your new match! 👋'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
