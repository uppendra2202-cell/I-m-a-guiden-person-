import React, { useState, useEffect, useRef } from 'react';
import { Message, UserProfile } from '../../lib/types';
import { dbService } from '../../lib/databaseService';
import { calculateAge, formatTimeAgo } from '../../lib/utils';
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  UserX,
  UserMinus,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

interface ChatRoomProps {
  matchId: string;
  matchedUser: UserProfile;
  currentUserId: string;
  onBack: () => void;
  onUnmatch: (matchId: string) => void;
  onBlock: (targetUserId: string) => void;
  onReport: (targetUserId: string) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  matchId,
  matchedUser,
  currentUserId,
  onBack,
  onUnmatch,
  onBlock,
  onReport,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load message history & setup real-time subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const history = await dbService.getMessages(matchId, currentUserId);
        setMessages(history);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }

      unsubscribe = dbService.subscribeToMessages(matchId, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [matchId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || sending) return;

    setInputText('');
    setSending(true);

    try {
      const msg = await dbService.sendMessage(
        matchId,
        currentUserId,
        matchedUser.id,
        content
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err: any) {
      alert(`Could not send message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  const photoUrl = matchedUser.photos?.[0] || '';
  const age = calculateAge(matchedUser.birth_date);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-white w-full max-w-md mx-auto relative overflow-hidden">
      {/* Chat Room Top Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            aria-label="Back to matches"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={matchedUser.display_name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-900/50 text-rose-300 font-bold flex items-center justify-center text-sm">
                {matchedUser.display_name.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-sm text-white leading-tight">
                {matchedUser.display_name}
              </h3>
              <span className="text-xs text-rose-400 font-normal">{age}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {matchedUser.city || 'Matched on LoveMatch'}
            </p>
          </div>
        </div>

        {/* Safety & Moderation Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            title="Match Actions"
          >
            <ShieldAlert size={18} />
          </button>

          {showActionsMenu && (
            <div className="absolute right-0 top-11 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  onReport(matchedUser.id);
                }}
                className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-800 rounded-xl flex items-center space-x-2 transition"
              >
                <ShieldAlert size={14} />
                <span>Report Account</span>
              </button>

              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  if (confirm(`Block ${matchedUser.display_name}? They will not be able to contact you or view your profile.`)) {
                    onBlock(matchedUser.id);
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-800 rounded-xl flex items-center space-x-2 transition"
              >
                <UserX size={14} />
                <span>Block User</span>
              </button>

              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  if (confirm(`Unmatch with ${matchedUser.display_name}? This action cannot be undone.`)) {
                    onUnmatch(matchId);
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl flex items-center space-x-2 transition"
              >
                <UserMinus size={14} />
                <span>Unmatch</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full mb-2" />
            <span>Decrypting secure conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <h4 className="font-bold text-sm text-slate-200">Start the conversation</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Break the ice! Mutual matches are 3x more likely to chat when you ask about something in their profile.
            </p>

            {/* Icebreaker prompts */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              <button
                onClick={() => handleQuickPrompt("Hey! Loved your profile. What's your favorite spot in the city?")}
                className="text-[11px] bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 px-3 py-1.5 rounded-full transition text-left"
              >
                ☕ Favorite spot in town?
              </button>
              <button
                onClick={() => handleQuickPrompt("Hi! Great to connect. Any good music or podcast recommendations lately?")}
                className="text-[11px] bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 px-3 py-1.5 rounded-full transition text-left"
              >
                🎵 Music recommendations?
              </button>
              <button
                onClick={() => handleQuickPrompt("Hey there! How has your week been treating you so far?")}
                className="text-[11px] bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 px-3 py-1.5 rounded-full transition text-left"
              >
                ✨ How's your week?
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white rounded-br-sm shadow-md'
                      : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/80 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-500 px-1">
                  <span>{formatTimeAgo(msg.created_at)}</span>
                  {isMe && <CheckCheck size={12} className="text-rose-400" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar (Zero photo/file attachments per v1 requirement) */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${matchedUser.display_name}...`}
          maxLength={2000}
          className="flex-1 bg-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-rose-500 border border-slate-700 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-11 h-11 bg-gradient-to-tr from-rose-500 to-pink-500 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition active:scale-95 shadow-md shadow-rose-500/20 shrink-0"
          aria-label="Send Message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
