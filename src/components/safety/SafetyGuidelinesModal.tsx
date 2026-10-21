import React, { useState } from 'react';
import { X, ShieldCheck, HeartHandshake, EyeOff, Lock, Mail } from 'lucide-react';

interface SafetyGuidelinesModalProps {
  onClose: () => void;
}

export const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'privacy' | 'terms' | 'support'>(
    'guidelines'
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Trust, Safety & Policies</h3>
            <p className="text-[11px] text-slate-400">LoveMatch Member Standards</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 text-xs font-semibold mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`py-2 px-3 border-b-2 whitespace-nowrap transition ${
              activeTab === 'guidelines'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Guidelines
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2 px-3 border-b-2 whitespace-nowrap transition ${
              activeTab === 'privacy'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-3 border-b-2 whitespace-nowrap transition ${
              activeTab === 'terms'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`py-2 px-3 border-b-2 whitespace-nowrap transition ${
              activeTab === 'support'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Support
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1">
          {activeTab === 'guidelines' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-start space-x-2.5">
                <HeartHandshake size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">Mutual Respect & Kindness</h4>
                  <p className="text-[11px] text-slate-300">
                    Treat everyone with respect. Harassment, hate speech, bullying, or unsolicited explicit remarks result in immediate profile suspension.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-start space-x-2.5">
                <Lock size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">Strict 18+ Adult Policy</h4>
                  <p className="text-[11px] text-slate-300">
                    LoveMatch is exclusively for consenting adults age 18 and older. Any account suspected of being underage will be suspended immediately.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-start space-x-2.5">
                <EyeOff size={18} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">Authenticity & No Impersonation</h4>
                  <p className="text-[11px] text-slate-300">
                    Use your real photos and identity. Creating fake accounts, bots, or commercial sales profiles violates our platform rules.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm">Privacy by Design</h4>
              <p>
                Your privacy is our core foundation. We never reveal your exact GPS coordinates, physical address, or phone number to other users.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Only your chosen display name, age, general city, and interests are shown.</li>
                <li>Chat messages are strictly encrypted with Supabase Row Level Security.</li>
                <li>You can delete your account and all associated data at any time from your profile page.</li>
              </ul>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm">Terms of Service Summary</h4>
              <p>
                By accessing LoveMatch, you confirm that you are at least 18 years old and agree to abide by our code of conduct.
              </p>
              <p className="text-slate-400">
                Matches can be terminated by either participant at any time. Content that infringes on copyright or promotes illicit activities will be removed promptly.
              </p>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Contact Support & Safety Team</h4>
              <p>
                Have a question, safety concern, or feature suggestion? Our dedicated support team is available 24/7.
              </p>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center space-x-3">
                <Mail size={18} className="text-rose-400" />
                <div>
                  <div className="text-[11px] text-slate-400">Email us anytime</div>
                  <div className="font-semibold text-white">support@lovematch.app</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
