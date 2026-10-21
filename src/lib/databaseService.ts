import {
  UserProfile,
  LikeRecord,
  MatchRecord,
  MatchItem,
  Message,
  BlockRecord,
  ReportRecord,
  SubscriptionRecord,
  InteractionResult,
  ReportReason,
  ModerationStatus,
} from './types';
import { INITIAL_FICTIONAL_PROFILES } from './seedData';
import { getSupabaseClient } from './supabaseClient';
import { calculateAge, isAtLeast18 } from './utils';

// Local storage persistent keys for standalone/demo & offline modes
const STORAGE_PROFILES = 'lovematch_db_profiles';
const STORAGE_LIKES = 'lovematch_db_likes';
const STORAGE_MATCHES = 'lovematch_db_matches';
const STORAGE_MESSAGES = 'lovematch_db_messages';
const STORAGE_BLOCKS = 'lovematch_db_blocks';
const STORAGE_REPORTS = 'lovematch_db_reports';
const STORAGE_SUBSCRIPTIONS = 'lovematch_db_subscriptions';
const STORAGE_CURRENT_USER_ID = 'lovematch_current_user_id';

class DatabaseService {
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.ensureInitialized();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('lovematch_realtime_bus');
      } catch {
        // fallback
      }
    }
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_PROFILES)) {
      localStorage.setItem(STORAGE_PROFILES, JSON.stringify(INITIAL_FICTIONAL_PROFILES));
    }
    if (!localStorage.getItem(STORAGE_LIKES)) {
      // Pre-seed a reciprocal like from Elena so when new user likes Elena, a real match occurs!
      const initialLikes: LikeRecord[] = [
        {
          id: 'seed-like-1',
          sender_id: '11111111-1111-4111-a111-111111111111', // Elena
          receiver_id: 'current-demo-user', // matched dynamically
          action: 'like',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_LIKES, JSON.stringify(initialLikes));
    }
    if (!localStorage.getItem(STORAGE_MATCHES)) {
      localStorage.setItem(STORAGE_MATCHES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_MESSAGES)) {
      localStorage.setItem(STORAGE_MESSAGES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_BLOCKS)) {
      localStorage.setItem(STORAGE_BLOCKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_REPORTS)) {
      localStorage.setItem(STORAGE_REPORTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_SUBSCRIPTIONS)) {
      localStorage.setItem(STORAGE_SUBSCRIPTIONS, JSON.stringify([]));
    }
  }

  // --- Helpers for Local Store ---
  private getLocalProfiles(): UserProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_PROFILES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalProfiles(profiles: UserProfile[]) {
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
  }

  private getLocalLikes(): LikeRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_LIKES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalLikes(likes: LikeRecord[]) {
    localStorage.setItem(STORAGE_LIKES, JSON.stringify(likes));
  }

  private getLocalMatches(): MatchRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_MATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalMatches(matches: MatchRecord[]) {
    localStorage.setItem(STORAGE_MATCHES, JSON.stringify(matches));
  }

  private getLocalMessages(): Message[] {
    try {
      const data = localStorage.getItem(STORAGE_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalMessages(msgs: Message[]) {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(msgs));
  }

  private getLocalBlocks(): BlockRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_BLOCKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalBlocks(blocks: BlockRecord[]) {
    localStorage.setItem(STORAGE_BLOCKS, JSON.stringify(blocks));
  }

  private getLocalReports(): ReportRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_REPORTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalReports(reports: ReportRecord[]) {
    localStorage.setItem(STORAGE_REPORTS, JSON.stringify(reports));
  }

  private getLocalSubscriptions(): SubscriptionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_SUBSCRIPTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalSubscriptions(subs: SubscriptionRecord[]) {
    localStorage.setItem(STORAGE_SUBSCRIPTIONS, JSON.stringify(subs));
  }

  // --- AUTHENTICATION & USER SESSIONS ---

  async signUp(params: {
    email: string;
    password: string;
    displayName: string;
    birthDate: string;
    gender: UserProfile['gender'];
    interestedIn: UserProfile['interested_in'];
  }): Promise<{ profile: UserProfile; error?: string }> {
    if (!isAtLeast18(params.birthDate)) {
      throw new Error('Age restriction: You must be at least 18 years old to join LoveMatch.');
    }

    if (!params.displayName.trim() || params.displayName.length < 2) {
      throw new Error('Please enter a valid display name (at least 2 characters).');
    }

    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            display_name: params.displayName,
            birth_date: params.birthDate,
            gender: params.gender,
            interested_in: params.interestedIn,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch or create profile
        const { data: prof } = await client
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (prof) {
          localStorage.setItem(STORAGE_CURRENT_USER_ID, prof.id);
          return { profile: prof as UserProfile };
        }
      }
    }

    // Local / Autonomous Mode
    const newId = 'user-' + Math.random().toString(36).substring(2, 10);
    const newProfile: UserProfile = {
      id: newId,
      email: params.email,
      display_name: params.displayName.trim(),
      birth_date: params.birthDate,
      gender: params.gender,
      interested_in: params.interestedIn,
      bio: '',
      interests: [],
      city: '',
      photos: [],
      is_suspended: false,
      is_profile_complete: false,
      min_age_pref: Math.max(18, calculateAge(params.birthDate) - 6),
      max_age_pref: calculateAge(params.birthDate) + 8,
      is_admin: params.email.toLowerCase().includes('admin'),
      daily_like_count: 0,
      last_like_reset_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const profiles = this.getLocalProfiles();
    profiles.push(newProfile);
    this.saveLocalProfiles(profiles);

    // Initialize free subscription
    const subs = this.getLocalSubscriptions();
    subs.push({
      id: 'sub-' + newId,
      user_id: newId,
      tier: 'free',
      status: 'active',
      created_at: new Date().toISOString(),
    });
    this.saveLocalSubscriptions(subs);

    localStorage.setItem(STORAGE_CURRENT_USER_ID, newId);
    return { profile: newProfile };
  }

  async signIn(email: string, password: string): Promise<{ profile: UserProfile; error?: string }> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        const { data: prof, error: profErr } = await client
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profErr) throw profErr;
        localStorage.setItem(STORAGE_CURRENT_USER_ID, prof.id);
        return { profile: prof as UserProfile };
      }
    }

    // Local mode search
    const profiles = this.getLocalProfiles();
    const found = profiles.find((p) => p.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error('Invalid email or password. You can also sign up with a new 18+ profile.');
    }
    if (found.is_suspended) {
      throw new Error('This account has been suspended for violating Community Guidelines.');
    }

    localStorage.setItem(STORAGE_CURRENT_USER_ID, found.id);
    return { profile: found };
  }

  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(STORAGE_CURRENT_USER_ID);
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.auth.getUser();
        if (data.user) {
          const { data: prof } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (prof) return prof as UserProfile;
        }
      } catch {
        // fallback
      }
    }

    const currentId = localStorage.getItem(STORAGE_CURRENT_USER_ID);
    if (!currentId) return null;
    const profiles = this.getLocalProfiles();
    const profile = profiles.find((p) => p.id === currentId);
    return profile || null;
  }

  // --- PROFILE MANAGEMENT ---

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    }

    const profiles = this.getLocalProfiles();
    const index = profiles.findIndex((p) => p.id === userId);
    if (index === -1) throw new Error('Profile not found');

    const updated: UserProfile = {
      ...profiles[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    profiles[index] = updated;
    this.saveLocalProfiles(profiles);
    return updated;
  }

  async deleteAccount(userId: string): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.from('profiles').delete().eq('id', userId);
      await client.auth.signOut();
    }

    let profiles = this.getLocalProfiles();
    profiles = profiles.filter((p) => p.id !== userId);
    this.saveLocalProfiles(profiles);

    let matches = this.getLocalMatches();
    matches = matches.filter((m) => m.user1_id !== userId && m.user2_id !== userId);
    this.saveLocalMatches(matches);

    let likes = this.getLocalLikes();
    likes = likes.filter((l) => l.sender_id !== userId && l.receiver_id !== userId);
    this.saveLocalLikes(likes);

    localStorage.removeItem(STORAGE_CURRENT_USER_ID);
  }

  // --- DISCOVERY FEED & SWIPING ---

  async getDiscoveryFeed(
    userId: string,
    filters?: {
      minAge?: number;
      maxAge?: number;
      gender?: UserProfile['gender'] | 'all';
    }
  ): Promise<UserProfile[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: pastLikes } = await client
          .from('likes')
          .select('receiver_id')
          .eq('sender_id', userId);

        const excludeIds = [userId, ...(pastLikes?.map((l) => l.receiver_id) || [])];

        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('is_suspended', false)
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(20);

        if (!error && data) {
          return data as UserProfile[];
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local dataset:', err);
      }
    }

    const profiles = this.getLocalProfiles();
    const likes = this.getLocalLikes();
    const blocks = this.getLocalBlocks();
    const matches = this.getLocalMatches();

    const currentUser = profiles.find((p) => p.id === userId);
    if (!currentUser) return [];

    // Excluded IDs: self, blocked, already liked/passed, or already actively matched
    const blockedIds = new Set(
      blocks
        .filter((b) => b.blocker_id === userId || b.blocked_id === userId)
        .map((b) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id))
    );

    const alreadyInteracted = new Set(
      likes.filter((l) => l.sender_id === userId).map((l) => l.receiver_id)
    );

    const matchedIds = new Set(
      matches
        .filter((m) => m.is_active && (m.user1_id === userId || m.user2_id === userId))
        .map((m) => (m.user1_id === userId ? m.user2_id : m.user1_id))
    );

    const minAge = filters?.minAge ?? currentUser.min_age_pref ?? 18;
    const maxAge = filters?.maxAge ?? currentUser.max_age_pref ?? 99;

    return profiles.filter((p) => {
      if (p.id === userId) return false;
      if (p.is_suspended) return false;
      if (blockedIds.has(p.id)) return false;
      if (alreadyInteracted.has(p.id)) return false;
      if (matchedIds.has(p.id)) return false;

      const age = calculateAge(p.birth_date);
      if (age < 18) return false;
      if (age < minAge || age > maxAge) return false;

      // Gender preference filter
      if (currentUser.interested_in === 'men' && p.gender !== 'man') return false;
      if (currentUser.interested_in === 'women' && p.gender !== 'woman') return false;

      return true;
    });
  }

  // --- RECORD USER INTERACTION (Exact match to record_user_interaction RPC) ---

  async recordInteraction(
    senderId: string,
    receiverId: string,
    action: 'like' | 'pass'
  ): Promise<InteractionResult> {
    if (senderId === receiverId) {
      throw new Error('Self interaction disallowed');
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('record_user_interaction', {
          p_receiver_id: receiverId,
          p_action: action,
        });
        if (error) throw error;
        return data as InteractionResult;
      } catch (err: any) {
        console.warn('RPC failed, executing secure local fallback:', err);
      }
    }

    const profiles = this.getLocalProfiles();
    const sender = profiles.find((p) => p.id === senderId);
    const receiver = profiles.find((p) => p.id === receiverId);

    if (!sender || !receiver) {
      throw new Error('User not found');
    }
    if (receiver.is_suspended) {
      throw new Error('Cannot interact with a suspended user');
    }

    const subs = this.getLocalSubscriptions();
    const sub = subs.find((s) => s.user_id === senderId && s.status === 'active');
    const isPremium = sub?.tier === 'premium';

    // Daily Like Quota Check
    const DAILY_LIMIT = 20;
    if (action === 'like' && !isPremium) {
      const lastReset = new Date(sender.last_like_reset_at || 0).getTime();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - lastReset > twentyFourHours) {
        sender.daily_like_count = 1;
        sender.last_like_reset_at = new Date().toISOString();
      } else {
        if (sender.daily_like_count >= DAILY_LIMIT) {
          return {
            success: false,
            error: 'DAILY_LIMIT_REACHED',
            message: `You've reached your free limit of ${DAILY_LIMIT} likes for today. Upgrade to LoveMatch Premium for unlimited swipes!`,
          };
        }
        sender.daily_like_count += 1;
      }
      this.saveLocalProfiles(profiles);
    }

    // Record like or pass
    const likes = this.getLocalLikes();
    const existingIndex = likes.findIndex(
      (l) => l.sender_id === senderId && l.receiver_id === receiverId
    );

    const nowIso = new Date().toISOString();
    if (existingIndex >= 0) {
      likes[existingIndex].action = action;
      likes[existingIndex].created_at = nowIso;
    } else {
      likes.push({
        id: 'like-' + Math.random().toString(36).substring(2, 9),
        sender_id: senderId,
        receiver_id: receiverId,
        action,
        created_at: nowIso,
      });
    }
    this.saveLocalLikes(likes);

    // Mutual Match Detection
    let isMutual = false;
    let matchId: string | null = null;

    if (action === 'like') {
      const reciprocalLike = likes.find(
        (l) => l.sender_id === receiverId && (l.receiver_id === senderId || l.receiver_id === 'current-demo-user') && l.action === 'like'
      );

      // Or if receiver is one of our fictional demo profiles, guarantee a thrilling mutual match!
      const isFictionalSeed = INITIAL_FICTIONAL_PROFILES.some((f) => f.id === receiverId);

      if (reciprocalLike || isFictionalSeed) {
        isMutual = true;

        const u1 = senderId < receiverId ? senderId : receiverId;
        const u2 = senderId < receiverId ? receiverId : senderId;

        const matches = this.getLocalMatches();
        let match = matches.find((m) => m.user1_id === u1 && m.user2_id === u2);

        if (match) {
          match.is_active = true;
          match.updated_at = nowIso;
          matchId = match.id;
        } else {
          matchId = 'match-' + Math.random().toString(36).substring(2, 9);
          matches.push({
            id: matchId,
            user1_id: u1,
            user2_id: u2,
            is_active: true,
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
        this.saveLocalMatches(matches);

        // Pre-create an organic initial greeting from fictional matches after 1.5s
        if (isFictionalSeed) {
          setTimeout(() => {
            this.sendAutomatedGreeting(matchId!, receiverId, senderId, receiver.display_name);
          }, 1500);
        }
      }
    }

    return {
      success: true,
      matched: isMutual,
      match_id: matchId,
    };
  }

  private sendAutomatedGreeting(
    matchId: string,
    senderId: string,
    receiverId: string,
    name: string
  ) {
    const greetings = [
      `Hey there! Nice to meet you. Loved your profile! What kind of coffee or music are you into?`,
      `Hi! So glad we matched 😊 How has your week been going?`,
      `Hey! Great to connect with you on LoveMatch. Any fun weekend plans?`,
    ];
    const text = greetings[Math.floor(Math.random() * greetings.length)];
    this.sendMessage(matchId, senderId, receiverId, text).catch(() => {});
  }

  // --- MATCHES & PRIVATE MESSAGING ---

  async getMatches(userId: string): Promise<MatchItem[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: matches, error } = await client
          .from('matches')
          .select('*')
          .eq('is_active', true)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (!error && matches) {
          const result: MatchItem[] = [];
          for (const m of matches) {
            const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
            const { data: partner } = await client
              .from('profiles')
              .select('*')
              .eq('id', partnerId)
              .single();

            if (partner && !partner.is_suspended) {
              result.push({
                match_id: m.id,
                matched_user: partner as UserProfile,
                updated_at: m.updated_at,
              });
            }
          }
          return result;
        }
      } catch (err) {
        console.warn('Supabase getMatches failed:', err);
      }
    }

    const matches = this.getLocalMatches().filter(
      (m) => m.is_active && (m.user1_id === userId || m.user2_id === userId)
    );
    const profiles = this.getLocalProfiles();
    const messages = this.getLocalMessages();
    const blocks = this.getLocalBlocks();

    const blockedIds = new Set(
      blocks
        .filter((b) => b.blocker_id === userId || b.blocked_id === userId)
        .map((b) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id))
    );

    const items: MatchItem[] = [];

    for (const m of matches) {
      const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
      if (blockedIds.has(partnerId)) continue;

      const partner = profiles.find((p) => p.id === partnerId);
      if (!partner || partner.is_suspended) continue;

      const chatMsgs = messages.filter((msg) => msg.match_id === m.id);
      const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : undefined;

      items.push({
        match_id: m.id,
        matched_user: partner,
        last_message: lastMsg?.content,
        last_message_time: lastMsg?.created_at,
        updated_at: lastMsg?.created_at || m.updated_at,
      });
    }

    // Sort by latest message/update
    return items.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  async getMessages(matchId: string, currentUserId: string): Promise<Message[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data as Message[];
        }
      } catch (err) {
        console.warn('Supabase getMessages error:', err);
      }
    }

    const msgs = this.getLocalMessages().filter((m) => m.match_id === matchId);
    return msgs.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Message content cannot be empty');

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('messages')
          .insert({
            match_id: matchId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: trimmed,
          })
          .select()
          .single();

        if (!error && data) {
          return data as Message;
        }
      } catch (err) {
        console.warn('Supabase insert message error:', err);
      }
    }

    const newMsg: Message = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      match_id: matchId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    const messages = this.getLocalMessages();
    messages.push(newMsg);
    this.saveLocalMessages(messages);

    // Update match timestamp
    const matches = this.getLocalMatches();
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      match.updated_at = newMsg.created_at;
      this.saveLocalMatches(matches);
    }

    // Broadcast realtime event
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'NEW_MESSAGE',
        message: newMsg,
      });
    }

    return newMsg;
  }

  subscribeToMessages(matchId: string, onMessage: (msg: Message) => void): () => void {
    const client = getSupabaseClient();
    if (client) {
      const channel = client
        .channel(`chat_${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            onMessage(payload.new as Message);
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }

    // Local BroadcastChannel listener
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_MESSAGE' && event.data.message?.match_id === matchId) {
        onMessage(event.data.message);
      }
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', handler);
    }

    return () => {
      if (this.broadcastChannel) {
        this.broadcastChannel.removeEventListener('message', handler);
      }
    };
  }

  async unmatch(matchId: string): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.from('matches').update({ is_active: false }).eq('id', matchId);
    }

    const matches = this.getLocalMatches();
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      match.is_active = false;
      this.saveLocalMatches(matches);
    }
  }

  // --- SAFETY, BLOCKING & REPORTING ---

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    }

    const blocks = this.getLocalBlocks();
    blocks.push({
      id: 'block-' + Math.random().toString(36).substring(2, 9),
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    });
    this.saveLocalBlocks(blocks);

    // Automatically deactivate any active match between them
    const matches = this.getLocalMatches();
    for (const m of matches) {
      if (
        (m.user1_id === blockerId && m.user2_id === blockedId) ||
        (m.user2_id === blockerId && m.user1_id === blockedId)
      ) {
        m.is_active = false;
      }
    }
    this.saveLocalMatches(matches);
  }

  async reportUser(
    reporterId: string,
    reportedId: string,
    reason: ReportReason,
    details: string
  ): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.from('reports').insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        details,
      });
    }

    const reports = this.getLocalReports();
    reports.push({
      id: 'rep-' + Math.random().toString(36).substring(2, 9),
      reporter_id: reporterId,
      reported_id: reportedId,
      reason,
      details,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    this.saveLocalReports(reports);

    // If reason is underage user, prompt swift immediate protection
    if (reason === 'underage_user') {
      console.warn(`[SAFETY TRIGGER]: User ${reportedId} reported as underage.`);
    }
  }

  // --- ADMIN MODERATION WORKFLOW ---

  async getAdminReports(): Promise<ReportRecord[]> {
    const reports = this.getLocalReports();
    const profiles = this.getLocalProfiles();

    return reports.map((rep) => ({
      ...rep,
      reported_user: profiles.find((p) => p.id === rep.reported_id),
      reporter_user: profiles.find((p) => p.id === rep.reporter_id),
    }));
  }

  async actionReport(
    reportId: string,
    action: 'suspend' | 'dismiss',
    adminNotes?: string
  ): Promise<void> {
    const reports = this.getLocalReports();
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return;

    if (action === 'suspend') {
      rep.status = 'actioned';
      // Suspend profile
      const profiles = this.getLocalProfiles();
      const target = profiles.find((p) => p.id === rep.reported_id);
      if (target) {
        target.is_suspended = true;
        this.saveLocalProfiles(profiles);
      }
    } else {
      rep.status = 'dismissed';
    }

    this.saveLocalReports(reports);
  }

  // --- MONETIZATION & SUBSCRIPTION ---

  async getSubscription(userId: string): Promise<SubscriptionRecord> {
    const subs = this.getLocalSubscriptions();
    const existing = subs.find((s) => s.user_id === userId);
    if (existing) return existing;

    const newSub: SubscriptionRecord = {
      id: 'sub-' + userId,
      user_id: userId,
      tier: 'free',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    subs.push(newSub);
    this.saveLocalSubscriptions(subs);
    return newSub;
  }

  async upgradeSubscription(userId: string): Promise<SubscriptionRecord> {
    const subs = this.getLocalSubscriptions();
    let sub = subs.find((s) => s.user_id === userId);
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (sub) {
      sub.tier = 'premium';
      sub.status = 'active';
      sub.valid_until = validUntil;
    } else {
      sub = {
        id: 'sub-' + userId,
        user_id: userId,
        tier: 'premium',
        status: 'active',
        valid_until: validUntil,
        created_at: new Date().toISOString(),
      };
      subs.push(sub);
    }

    this.saveLocalSubscriptions(subs);
    return sub;
  }

  // Rewind/undo last pass (Premium feature)
  async rewindLastPass(userId: string): Promise<UserProfile | null> {
    const likes = this.getLocalLikes();
    const passIndex = [...likes]
      .reverse()
      .findIndex((l) => l.sender_id === userId && l.action === 'pass');

    if (passIndex === -1) return null;

    const actualIndex = likes.length - 1 - passIndex;
    const rewound = likes.splice(actualIndex, 1)[0];
    this.saveLocalLikes(likes);

    const profiles = this.getLocalProfiles();
    return profiles.find((p) => p.id === rewound.receiver_id) || null;
  }

  // Get users who liked the current user (Premium feature)
  async getWhoLikedMe(userId: string): Promise<UserProfile[]> {
    const likes = this.getLocalLikes();
    const profiles = this.getLocalProfiles();
    const blocks = this.getLocalBlocks();

    const blockedIds = new Set(
      blocks
        .filter((b) => b.blocker_id === userId || b.blocked_id === userId)
        .map((b) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id))
    );

    const likerIds = likes
      .filter((l) => l.receiver_id === userId && l.action === 'like' && !blockedIds.has(l.sender_id))
      .map((l) => l.sender_id);

    return profiles.filter((p) => likerIds.includes(p.id) && !p.is_suspended);
  }
}

export const dbService = new DatabaseService();
