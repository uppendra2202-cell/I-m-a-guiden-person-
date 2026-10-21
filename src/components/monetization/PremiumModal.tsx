import React, { useState } from 'react';
import { X, Sparkles, Check, Heart, RotateCcw, Eye, Zap, ShieldCheck } from 'lucide-react';
import { dbService } from '../../lib/databaseService';

interface PremiumModalProps {
  userId: string;
  isPremium?: boolean;
  onClose: () => void;
  onUpgraded: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  userId,
  isPremium = false,
  onClose,
  onUpgraded,
}) => {
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      // In production: Redirects to Stripe Customer Portal or Checkout Session URL.
      // Here we process via the secure subscription database service.
      await dbService.upgradeSubscription(userId);
      alert('Congratulations! Your LoveMatch Premium membership is now active.');
      onUpgraded();
      onClose();
    } catch (err: any) {
      alert(`Upgrade error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
        >
          <X size={18} />
        </button>

        {/* Crown & Brand */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2.5">
            <Sparkles size={28} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black text-white font-display">LoveMatch Premium</h2>
          <p className="text-xs text-amber-300 font-medium mt-0.5">
            Unlock the ultimate authentic dating experience
          </p>
        </div>

        {/* Tier Comparisons */}
        <div className="space-y-2.5 my-4">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <div className="font-bold text-white">Unlimited Swipes & Likes</div>
              <div className="text-[11px] text-slate-400">Never wait for daily quota limits</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <Eye size={16} />
            </div>
            <div>
              <div className="font-bold text-white">See Who Liked You</div>
              <div className="text-[11px] text-slate-400">Match instantly without searching</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <RotateCcw size={16} />
            </div>
            <div>
              <div className="font-bold text-white">Rewind Passes</div>
              <div className="text-[11px] text-slate-400">Second chance if you passed by accident</div>
            </div>
          </div>
        </div>

        {/* Plan Pricing Picker */}
        <div className="grid grid-cols-2 gap-2 my-5">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`p-3 rounded-2xl border text-center transition ${
              billingCycle === 'monthly'
                ? 'border-amber-500 bg-amber-500/10 text-white'
                : 'border-slate-800 bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className="text-xs font-semibold">1 Month</div>
            <div className="text-lg font-black text-white mt-0.5">$9.99</div>
            <div className="text-[10px] text-slate-400">Billed monthly</div>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`p-3 rounded-2xl border text-center relative transition ${
              billingCycle === 'yearly'
                ? 'border-amber-500 bg-amber-500/10 text-white'
                : 'border-slate-800 bg-slate-800/50 text-slate-400'
            }`}
          >
            <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-rose-500 text-[9px] font-black uppercase text-white px-1.5 py-0.5 rounded-full">
              Save 40%
            </span>
            <div className="text-xs font-semibold">12 Months</div>
            <div className="text-lg font-black text-white mt-0.5">$5.99<span className="text-xs font-normal">/mo</span></div>
            <div className="text-[10px] text-slate-400">$71.88 / year</div>
          </button>
        </div>

        {/* CTA Button */}
        {isPremium ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-xs text-emerald-300 font-semibold">
            ✓ Your Premium Membership is Active
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={processing}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{processing ? 'Connecting Stripe Gateway...' : 'Upgrade Now'}</span>
          </button>
        )}

        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 mt-4 text-center">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Secure checkout · Cancel anytime from Account Settings</span>
        </div>
      </div>
    </div>
  );
};
