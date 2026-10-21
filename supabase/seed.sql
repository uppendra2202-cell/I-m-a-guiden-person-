-- LoveMatch Seed Data for PostgreSQL/Supabase
-- Explicitly fictional adult demo records

DO $$
DECLARE
    u1 UUID := '11111111-1111-4111-a111-111111111111';
    u2 UUID := '22222222-2222-4222-a222-222222222222';
    u3 UUID := '33333333-3333-4333-a333-333333333333';
    u4 UUID := '44444444-4444-4444-a444-444444444444';
BEGIN
    -- Insert auth demo accounts if auth.users exists
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES 
    (u1, 'elena.fictional@lovematch.demo', '{"display_name":"Elena","birth_date":"1998-04-12","gender":"woman","interested_in":"men"}'::jsonb),
    (u2, 'marcus.fictional@lovematch.demo', '{"display_name":"Marcus","birth_date":"1996-09-21","gender":"man","interested_in":"women"}'::jsonb),
    (u3, 'sarah.fictional@lovematch.demo', '{"display_name":"Sarah","birth_date":"2000-02-18","gender":"woman","interested_in":"everyone"}'::jsonb),
    (u4, 'david.fictional@lovematch.demo', '{"display_name":"David","birth_date":"1997-07-04","gender":"man","interested_in":"women"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (
        id, display_name, birth_date, gender, interested_in, bio, interests, city, photos, is_profile_complete
    )
    VALUES
    (u1, 'Elena', '1998-04-12', 'woman', 'men', 'Architect & urban sketcher. Specialty coffee addict, weekend hiker.', ARRAY['Architecture', 'Coffee', 'Hiking'], 'Seattle, WA', ARRAY['/src/assets/images/portrait_woman_elena_1792608307025.jpg'], TRUE),
    (u2, 'Marcus', '1996-09-21', 'man', 'women', 'Product designer & amateur jazz guitarist. Bouldering and vinyl records.', ARRAY['Design', 'Music', 'Bouldering'], 'San Francisco, CA', ARRAY['/src/assets/images/portrait_man_marcus_1792608308937.jpg'], TRUE),
    (u3, 'Sarah', '2000-02-18', 'woman', 'everyone', 'Botanist & creative director. Plant parent to 40+ species. Indie concerts & cinema.', ARRAY['Plants', 'Indie Music', 'Cinema'], 'Austin, TX', ARRAY['/src/assets/images/portrait_woman_sarah_1792608308812.jpg'], TRUE),
    (u4, 'David', '1997-07-04', 'man', 'women', 'Software engineer by day, foodie & triathlon runner on weekends.', ARRAY['Running', 'Board Games', 'Tech'], 'New York, NY', ARRAY['/src/assets/images/portrait_man_david_1792608309458.jpg'], TRUE)
    ON CONFLICT (id) DO UPDATE SET
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        city = EXCLUDED.city,
        photos = EXCLUDED.photos,
        is_profile_complete = TRUE;

    -- Subscriptions
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES
    (u1, 'free', 'active'),
    (u2, 'free', 'active'),
    (u3, 'free', 'active'),
    (u4, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
END $$;
