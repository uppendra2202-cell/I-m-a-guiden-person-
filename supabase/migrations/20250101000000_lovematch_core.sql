-- LoveMatch Core Database Schema Migration
-- Designed for Supabase / PostgreSQL with strict RLS and 18+ enforcement

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Enum Types
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('man', 'woman', 'non_binary', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_preference_type AS ENUM ('men', 'women', 'everyone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_reason_type AS ENUM (
        'fake_profile',
        'harassment',
        'scam',
        'inappropriate_content',
        'underage_user',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_status_type AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 50),
    birth_date DATE NOT NULL,
    gender gender_type NOT NULL,
    interested_in gender_preference_type NOT NULL,
    bio TEXT CHECK (char_length(bio) <= 500),
    interests TEXT[] DEFAULT '{}'::TEXT[],
    city TEXT CHECK (char_length(city) <= 80),
    photos TEXT[] DEFAULT '{}'::TEXT[],
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    min_age_pref INT NOT NULL DEFAULT 18 CHECK (min_age_pref >= 18),
    max_age_pref INT NOT NULL DEFAULT 99 CHECK (max_age_pref >= min_age_pref),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    daily_like_count INT NOT NULL DEFAULT 0,
    last_like_reset_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT check_adult_age CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years')
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. LIKES TABLE
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT no_self_interaction CHECK (sender_id <> receiver_id),
    CONSTRAINT unique_sender_receiver UNIQUE (sender_id, receiver_id)
);

-- 4. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT ordered_pair CHECK (user1_id < user2_id),
    CONSTRAINT unique_user_pair UNIQUE (user1_id, user2_id)
);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT sender_diff_receiver CHECK (sender_id <> receiver_id)
);

-- 6. BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id),
    CONSTRAINT unique_block_pair UNIQUE (blocker_id, blocked_id)
);

-- 7. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason report_reason_type NOT NULL,
    details TEXT CHECK (char_length(details) <= 1000),
    status moderation_status_type NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT no_self_report CHECK (reporter_id <> reported_id)
);

-- 8. MODERATION ACTIONS TABLE (Audit Log)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('suspend', 'reinstate', 'dismiss_report', 'photo_removal')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_discovery ON public.profiles(gender, birth_date, is_suspended, is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_likes_receiver_sender ON public.likes(receiver_id, sender_id, action);
CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches(user1_id, user2_id, is_active);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_lookup ON public.blocks(blocker_id, blocked_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (
    is_suspended = FALSE 
    AND id NOT IN (
        SELECT blocked_id FROM public.blocks WHERE blocker_id = auth.uid()
        UNION
        SELECT blocker_id FROM public.blocks WHERE blocked_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can edit own profile" ON public.profiles;
CREATE POLICY "Users can edit own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- RLS POLICIES FOR MATCHES
DROP POLICY IF EXISTS "Match participants can view their matches" ON public.matches;
CREATE POLICY "Match participants can view their matches"
ON public.matches FOR SELECT
TO authenticated
USING ((auth.uid() = user1_id OR auth.uid() = user2_id) AND is_active = TRUE);

DROP POLICY IF EXISTS "Match participants can deactivate matches" ON public.matches;
CREATE POLICY "Match participants can deactivate matches"
ON public.matches FOR UPDATE
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (is_active = FALSE);

-- RLS POLICIES FOR MESSAGES
DROP POLICY IF EXISTS "Match participants can read conversation messages" ON public.messages;
CREATE POLICY "Match participants can read conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = messages.match_id
        AND m.is_active = TRUE
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = messages.sender_id)
           OR (b.blocker_id = messages.sender_id AND b.blocked_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Match participants can send messages" ON public.messages;
CREATE POLICY "Match participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
        AND m.is_active = TRUE
        AND (
            (m.user1_id = auth.uid() AND m.user2_id = receiver_id) OR
            (m.user2_id = auth.uid() AND m.user1_id = receiver_id)
        )
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = receiver_id)
           OR (b.blocker_id = receiver_id AND b.blocked_id = auth.uid())
    )
);

-- RLS POLICIES FOR BLOCKS & REPORTS
DROP POLICY IF EXISTS "Users manage own blocks" ON public.blocks;
CREATE POLICY "Users manage own blocks"
ON public.blocks FOR ALL
TO authenticated
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports"
ON public.reports FOR SELECT
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- STORED PROCEDURE: RECORD LIKE & MUTUAL MATCHING
CREATE OR REPLACE FUNCTION public.record_user_interaction(
    p_receiver_id UUID,
    p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sender_id UUID;
    v_is_mutual BOOLEAN := FALSE;
    v_match_id UUID := NULL;
    v_sender_u1 UUID;
    v_sender_u2 UUID;
    v_daily_limit INT := 20;
    v_current_count INT;
    v_last_reset TIMESTAMPTZ;
    v_is_premium BOOLEAN := FALSE;
BEGIN
    v_sender_id := auth.uid();
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_sender_id = p_receiver_id THEN
        RAISE EXCEPTION 'You cannot like or pass yourself';
    END IF;

    -- Verify target is not suspended
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_receiver_id AND is_suspended = TRUE) THEN
        RAISE EXCEPTION 'Cannot interact with suspended user';
    END IF;

    -- Verify no block exists
    IF EXISTS (
        SELECT 1 FROM blocks 
        WHERE (blocker_id = v_sender_id AND blocked_id = p_receiver_id)
           OR (blocker_id = p_receiver_id AND blocked_id = v_sender_id)
    ) THEN
        RAISE EXCEPTION 'Interaction forbidden due to block';
    END IF;

    -- Verify premium status
    SELECT (tier = 'premium' AND status = 'active' AND (valid_until IS NULL OR valid_until > now()))
    INTO v_is_premium
    FROM subscriptions WHERE user_id = v_sender_id;

    v_is_premium := COALESCE(v_is_premium, FALSE);

    -- Enforce daily like quota on free accounts
    IF p_action = 'like' AND NOT v_is_premium THEN
        SELECT daily_like_count, last_like_reset_at INTO v_current_count, v_last_reset
        FROM profiles WHERE id = v_sender_id FOR UPDATE;

        IF v_last_reset < timezone('utc', now() - INTERVAL '24 hours') THEN
            UPDATE profiles 
            SET daily_like_count = 1, last_like_reset_at = timezone('utc', now())
            WHERE id = v_sender_id;
        ELSE
            IF v_current_count >= v_daily_limit THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'DAILY_LIMIT_REACHED',
                    'message', 'You have reached your daily quota of 20 likes. Upgrade to LoveMatch Premium for unlimited swipes!'
                );
            END IF;
            UPDATE profiles SET daily_like_count = daily_like_count + 1 WHERE id = v_sender_id;
        END IF;
    END IF;

    -- Insert or update like
    INSERT INTO likes (sender_id, receiver_id, action)
    VALUES (v_sender_id, p_receiver_id, p_action)
    ON CONFLICT (sender_id, receiver_id)
    DO UPDATE SET action = EXCLUDED.action, created_at = timezone('utc', now());

    -- Detect mutual like
    IF p_action = 'like' THEN
        IF EXISTS (
            SELECT 1 FROM likes
            WHERE sender_id = p_receiver_id
              AND receiver_id = v_sender_id
              AND action = 'like'
        ) THEN
            v_is_mutual := TRUE;

            IF v_sender_id < p_receiver_id THEN
                v_sender_u1 := v_sender_id;
                v_sender_u2 := p_receiver_id;
            ELSE
                v_sender_u1 := p_receiver_id;
                v_sender_u2 := v_sender_id;
            END IF;

            INSERT INTO matches (user1_id, user2_id, is_active)
            VALUES (v_sender_u1, v_sender_u2, TRUE)
            ON CONFLICT (user1_id, user2_id)
            DO UPDATE SET is_active = TRUE, updated_at = timezone('utc', now())
            RETURNING id INTO v_match_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'matched', v_is_mutual,
        'match_id', v_match_id
    );
END;
$$;
