import React, { useState } from 'react';
import { ReportReason } from '../../lib/types';
import { dbService } from '../../lib/databaseService';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  reportedUserId: string;
  reporterUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedUserId,
  reporterUserId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason>('inappropriate_content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await dbService.reportUser(reporterUserId, reportedUserId, reason, details.trim());
      alert('Report received. Our safety moderation team reviews all reports promptly.');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Report Member</h3>
            <p className="text-[11px] text-slate-400">Keep our community authentic & safe</p>
          </div>
        </div>

        {reason === 'underage_user' && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2 text-xs text-red-300">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>
              Underage reports are treated with highest urgency. LoveMatch strictly enforces a zero-tolerance policy for minors.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Select Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-rose-500"
            >
              <option value="underage_user">Suspected Underage (&lt;18 years old)</option>
              <option value="fake_profile">Fake Profile or Impersonation</option>
              <option value="harassment">Harassment or Abusive Behavior</option>
              <option value="scam">Scam, Commercial Solicitation, or Bot</option>
              <option value="inappropriate_content">Inappropriate or Explicit Photos</option>
              <option value="other">Other Community Violation</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any helpful context for our moderators..."
              maxLength={1000}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-400 p-2 bg-red-500/10 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
