import React, { useState, useEffect } from 'react';
import { ReportRecord } from '../lib/types';
import { dbService } from '../lib/databaseService';
import { formatTimeAgo } from '../lib/utils';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  Ban,
  AlertTriangle,
  User,
  Clock,
} from 'lucide-react';

interface AdminModerationPageProps {
  onBack: () => void;
}

export const AdminModerationPage: React.FC<AdminModerationPageProps> = ({ onBack }) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAdminReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, action: 'suspend' | 'dismiss') => {
    try {
      await dbService.actionReport(reportId, action);
      fetchReports();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="w-full max-w-md mx-auto p-4 text-white space-y-4">
      {/* Top Bar */}
      <div className="flex items-center space-x-3 mb-2">
        <button
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-black font-display text-white">Staff Moderation Queue</h2>
          <p className="text-xs text-slate-400">
            {pendingReports.length} pending safety tickets
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading safety logs...</div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center my-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} />
          </div>
          <h3 className="font-bold text-sm text-white">Moderation Inbox Clean</h3>
          <p className="text-xs text-slate-400 mt-1">
            No pending community reports. System invariants and safety rules verified.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => {
            const isUnderage = rep.reason === 'underage_user';
            const reportedUser = rep.reported_user;

            return (
              <div
                key={rep.id}
                className={`p-4 rounded-2xl border transition ${
                  isUnderage
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isUnderage
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {rep.reason.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock size={11} />
                      <span>{formatTimeAgo(rep.created_at)}</span>
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rep.status === 'actioned'
                        ? 'bg-red-500/20 text-red-300'
                        : rep.status === 'dismissed'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-200">
                  <div className="font-bold text-white">
                    Reported User:{' '}
                    <span className="text-rose-400">
                      {reportedUser ? reportedUser.display_name : rep.reported_id}
                    </span>
                  </div>
                  {rep.details && (
                    <p className="mt-1 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                      "{rep.details}"
                    </p>
                  )}
                </div>

                {rep.status === 'pending' && (
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleAction(rep.id, 'suspend')}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                    >
                      <Ban size={13} />
                      <span>Suspend Account</span>
                    </button>
                    <button
                      onClick={() => handleAction(rep.id, 'dismiss')}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                    >
                      Dismiss
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
