import React, { useState } from 'react';
import { UserProfile } from '../lib/types';
import { calculateAge } from '../lib/utils';
import { PhotoUploader } from '../components/profile/PhotoUploader';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/databaseService';
import {
  User,
  MapPin,
  Calendar,
  Sparkles,
  LogOut,
  Trash2,
  Save,
  ShieldAlert,
  Sliders,
  Check,
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: UserProfile;
  isPremium?: boolean;
  onOpenPremium: () => void;
  onOpenAdminPortal: () => void;
  onProfileUpdated: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  isPremium = false,
  onOpenPremium,
  onOpenAdminPortal,
  onProfileUpdated,
}) => {
  const { signOut, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [city, setCity] = useState(currentUser.city || '');
  const [photos, setPhotos] = useState<string[]>(currentUser.photos || []);
  const [interestsText, setInterestsText] = useState(
    (currentUser.interests || []).join(', ')
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const age = calculateAge(currentUser.birth_date);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const interestsArray = interestsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        city: city.trim(),
        photos,
        interests: interestsArray,
        is_profile_complete: photos.length > 0 && bio.trim().length > 0,
      });

      setSaveSuccess(true);
      onProfileUpdated();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt(
      'Are you sure you want to delete your profile? All matches, photos, and messages will be permanently deleted. Type "DELETE" to confirm:'
    );
    if (confirmText === 'DELETE') {
      await dbService.deleteAccount(currentUser.id);
      await signOut();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 text-white space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black font-display text-white">Your Profile</h2>
          <p className="text-xs text-slate-400">Manage photos, bio & account privacy</p>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs transition"
          title="Sign out of LoveMatch"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Staff Admin Portal Banner if admin */}
      {currentUser.is_admin && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-purple-300">Staff Moderation Panel</div>
            <div className="text-[11px] text-slate-400">Review member safety reports</div>
          </div>
          <button
            onClick={onOpenAdminPortal}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            Open Portal
          </button>
        </div>
      )}

      {/* Membership Banner */}
      <div
        onClick={onOpenPremium}
        className={`p-4 rounded-3xl border cursor-pointer transition shadow-xl ${
          isPremium
            ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-amber-500/40 text-amber-200'
            : 'bg-slate-900 border-slate-800 hover:border-amber-500/40 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                {isPremium ? 'LoveMatch Premium Active' : 'LoveMatch Free Tier'}
              </div>
              <div className="text-xs text-slate-400">
                {isPremium
                  ? 'Unlimited likes · See who liked you · Rewind passes'
                  : 'Daily 20 likes limit · Tap to upgrade'}
              </div>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-400 hover:underline">
            {isPremium ? 'Manage' : 'Upgrade'}
          </button>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        {/* Photo Uploader */}
        <PhotoUploader photos={photos} onChange={setPhotos} maxPhotos={4} />

        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Age</label>
              <div className="text-xs bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-400">
                {age} yrs (Verified)
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Seattle, WA"
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              About Me (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What makes you laugh, what you enjoy on weekends..."
              maxLength={500}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-rose-500 resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Interests & Passions (Comma separated)
            </label>
            <input
              type="text"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="e.g. Hiking, Specialty Coffee, Photography, Music"
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-rose-500"
            />
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
              <Check size={16} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Account Deletion / Danger Zone */}
      <div className="bg-slate-900 border border-red-500/20 rounded-3xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-red-400">Danger Zone</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Permanently delete your profile, uploaded photos, matches, and message history. This action is irreversible.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
        >
          <Trash2 size={14} />
          <span>Delete My Account Permanently</span>
        </button>
      </div>
    </div>
  );
};
