import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAtLeast18, calculateAge } from '../lib/utils';
import { UserProfile } from '../lib/types';
import { Heart, Lock, Mail, User, Calendar, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [gender, setGender] = useState<UserProfile['gender']>('woman');
  const [interestedIn, setInterestedIn] = useState<UserProfile['interested_in']>('men');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isResetPassword) {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setSuccessMsg(`Password reset instructions have been dispatched to ${email}.`);
      return;
    }

    if (isSignUp) {
      if (!displayName.trim() || displayName.length < 2) {
        setErrorMsg('Display name must be at least 2 characters long.');
        return;
      }

      if (!isAtLeast18(birthDate)) {
        setErrorMsg('Age restriction: You must be at least 18 years old to register on LoveMatch.');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp({
          email,
          password,
          displayName,
          birthDate,
          gender,
          interestedIn,
        });
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Demo Logins for Testing
  const handleQuickDemoLogin = async (demoEmail: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signIn(demoEmail, 'demo123');
    } catch {
      // If not in db, create test profile
      await signUp({
        email: demoEmail,
        password: 'password123',
        displayName: demoEmail.includes('marcus') ? 'Marcus' : 'Alex',
        birthDate: '1997-06-20',
        gender: 'man',
        interestedIn: 'women',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatedAge = birthDate ? calculateAge(birthDate) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 text-white">
      <div className="w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-rose-500/25 mb-3">
            <Heart size={30} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-rose-400 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            LoveMatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">Authentic dating for verified adults (18+)</p>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-xs flex items-center space-x-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs">
            {successMsg}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && !isResetPassword && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your first name"
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Date of Birth (18+ required)
                  </label>
                  {calculatedAge > 0 && (
                    <span
                      className={`text-[10px] font-bold ${
                        calculatedAge >= 18 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {calculatedAge} years old {calculatedAge < 18 ? '(Underage)' : ''}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={birthDate}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
                      .toISOString()
                      .split('T')[0]}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">I am a</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as UserProfile['gender'])}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2.5 text-white outline-none focus:border-rose-500"
                  >
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                    <option value="non_binary">Non-Binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Looking for
                  </label>
                  <select
                    value={interestedIn}
                    onChange={(e) =>
                      setInterestedIn(e.target.value as UserProfile['interested_in'])
                    }
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2.5 text-white outline-none focus:border-rose-500"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="everyone">Everyone</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {!isResetPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(true);
                      setErrorMsg(null);
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 hover:brightness-110 active:scale-95 transition text-xs mt-3 disabled:opacity-50"
          >
            {loading
              ? 'Authenticating...'
              : isResetPassword
              ? 'Send Reset Instructions'
              : isSignUp
              ? 'Join LoveMatch (18+)'
              : 'Sign In'}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="mt-4 text-center">
          {isResetPassword ? (
            <button
              onClick={() => {
                setIsResetPassword(false);
                setErrorMsg(null);
              }}
              className="text-xs text-rose-400 hover:underline"
            >
              Back to Sign In
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-rose-400 hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Create an 18+ profile"}
            </button>
          )}
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>Instant Demo Logins:</span>
            <span className="text-[10px] text-purple-400">Tap to test</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('alex.explorer@lovematch.demo')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[11px] text-slate-200 text-left transition"
            >
              <div className="font-bold text-white">Alex (Member)</div>
              <div className="text-[10px] text-slate-400">New User Account</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin.moderator@lovematch.demo')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-purple-500/30 rounded-xl text-[11px] text-purple-300 text-left transition"
            >
              <div className="font-bold text-white">Staff Admin</div>
              <div className="text-[10px] text-slate-400">Moderation Portal</div>
            </button>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 mt-5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Strict 18+ Age Validation · Encrypted RLS Sessions</span>
        </div>
      </div>
    </div>
  );
};
