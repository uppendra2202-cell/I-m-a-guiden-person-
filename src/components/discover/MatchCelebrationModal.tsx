import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../../lib/types';
import { Heart, MessageCircle, ArrowRight } from 'lucide-react';

interface MatchCelebrationModalProps {
  currentUser: UserProfile;
  matchedCandidate: UserProfile;
  onOpenChat: () => void;
  onContinue: () => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  currentUser,
  matchedCandidate,
  onOpenChat,
  onContinue,
}) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#a855f7', '#fb7185', '#ffffff'],
      });
    } catch {
      // fallback if canvas not available
    }
  }, []);

  const myPhoto = currentUser.photos?.[0] || '';
  const matchPhoto = matchedCandidate.photos?.[0] || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
        {/* Glowing Badge */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 mx-auto flex items-center justify-center shadow-xl shadow-rose-500/40 mb-3 animate-bounce">
          <Heart size={32} className="text-white fill-white" />
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-purple-300 font-display">
          It's a Match!
        </h2>
        <p className="text-xs text-slate-300 mt-2">
          You and <span className="font-bold text-white">{matchedCandidate.display_name}</span> liked each other.
        </p>

        {/* Dual Avatars Connection */}
        <div className="flex justify-center items-center -space-x-4 my-6">
          <div className="relative">
            {myPhoto ? (
              <img
                src={myPhoto}
                alt={currentUser.display_name}
                className="w-20 h-20 rounded-full border-4 border-slate-900 object-cover shadow-xl ring-2 ring-rose-500/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-rose-900/60 flex items-center justify-center text-white font-bold text-xl shadow-xl">
                {currentUser.display_name.charAt(0)}
              </div>
            )}
          </div>

          <div className="relative z-10 w-9 h-9 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Heart size={16} className="fill-white" />
          </div>

          <div className="relative">
            {matchPhoto ? (
              <img
                src={matchPhoto}
                alt={matchedCandidate.display_name}
                className="w-20 h-20 rounded-full border-4 border-slate-900 object-cover shadow-xl ring-2 ring-pink-500/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-purple-900/60 flex items-center justify-center text-white font-bold text-xl shadow-xl">
                {matchedCandidate.display_name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onOpenChat}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/25 hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 text-sm"
          >
            <MessageCircle size={18} />
            <span>Send a Message</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onContinue}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-2xl transition text-xs"
          >
            Keep Exploring Profiles
          </button>
        </div>
      </div>
    </div>
  );
};
