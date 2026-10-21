export type Gender = 'man' | 'woman' | 'non_binary' | 'other';
export type GenderPreference = 'men' | 'women' | 'everyone';

export type ReportReason =
  | 'fake_profile'
  | 'harassment'
  | 'scam'
  | 'inappropriate_content'
  | 'underage_user'
  | 'other';

export type ModerationStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';

export interface UserProfile {
  id: string;
  email?: string;
  display_name: string;
  birth_date: string; // YYYY-MM-DD
  gender: Gender;
  interested_in: GenderPreference;
  bio: string;
  interests: string[];
  city: string;
  photos: string[];
  is_suspended: boolean;
  is_profile_complete: boolean;
  min_age_pref: number;
  max_age_pref: number;
  is_admin: boolean;
  daily_like_count: number;
  last_like_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface LikeRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  action: 'like' | 'pass';
  created_at: string;
}

export interface MatchRecord {
  id: string;
  user1_id: string;
  user2_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchItem {
  match_id: string;
  matched_user: UserProfile;
  last_message?: string;
  last_message_time?: string;
  updated_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface BlockRecord {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ReportRecord {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string;
  status: ModerationStatus;
  created_at: string;
  reported_user?: UserProfile;
  reporter_user?: UserProfile;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  tier: 'free' | 'premium';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  valid_until?: string | null;
  created_at: string;
}

export interface InteractionResult {
  success: boolean;
  matched?: boolean;
  match_id?: string | null;
  error?: string;
  message?: string;
}
