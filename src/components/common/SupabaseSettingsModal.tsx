import React, { useState } from 'react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
} from '../../lib/supabaseClient';
import { X, Database, Check, ShieldCheck, Download, RefreshCw, Key, Globe } from 'lucide-react';

interface SupabaseSettingsModalProps {
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!url.trim() || !anonKey.trim()) {
      setErrorMsg('Please enter both Supabase Project URL and Anon/Public API Key.');
      return;
    }

    const ok = saveSupabaseConfig(url, anonKey);
    if (!ok) {
      setErrorMsg('Invalid URL format. Example: https://xyzcompany.supabase.co');
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onConfigUpdated();
      onClose();
    }, 1000);
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    onConfigUpdated();
  };

  const handleDownloadSql = () => {
    const link = document.createElement('a');
    link.href = '/supabase/migrations/20250101000000_lovematch_core.sql';
    link.download = 'lovematch_core.sql';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">Supabase Cloud Database</h3>
            <p className="text-xs text-slate-400">PostgreSQL, Row Level Security & Auth</p>
          </div>
        </div>

        {/* Current Status Box */}
        <div
          className={`mt-4 p-3.5 rounded-2xl border text-xs leading-relaxed ${
            currentConfig.isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-purple-500/10 border-purple-500/30 text-purple-200'
          }`}
        >
          <div className="font-bold flex items-center space-x-1.5 mb-1">
            <ShieldCheck size={16} />
            <span>
              {currentConfig.isConfigured
                ? 'Connected to Live Supabase Project'
                : 'Interactive Autonomous Engine Active'}
            </span>
          </div>
          <p className="text-slate-300">
            {currentConfig.isConfigured
              ? 'All profile updates, mutual matches, and messages are synchronized with your Supabase PostgreSQL database.'
              : 'LoveMatch is operating with local storage persistence and mock fictional matches. You can connect your live Supabase project below at any time.'}
          </p>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1">
              <Globe size={13} className="text-slate-400" />
              <span>Project URL</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1">
              <Key size={13} className="text-slate-400" />
              <span>Anon / Public API Key</span>
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500 font-mono"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
              <Check size={16} />
              <span>Supabase credentials saved! Connecting...</span>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 hover:brightness-105 active:scale-95 transition"
            >
              Save & Connect
            </button>
            {currentConfig.isConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        {/* Database Migration helper */}
        <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300">Database Setup Instructions</div>
          <p className="text-[11px] text-slate-400 leading-normal">
            1. Create a free project at <span className="text-rose-400">database.new</span>
            <br />
            2. Run the migration SQL in your Supabase SQL Editor.
          </p>

          <button
            type="button"
            onClick={handleDownloadSql}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <Download size={14} />
            <span>Download Database Migration SQL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
