# LoveMatch — Mobile-First Dating Web Application

LoveMatch is a modern, responsive dating web application built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**, designed for Android mobile devices and desktop web browsers. It integrates **Supabase** for PostgreSQL database persistence, Row Level Security (RLS) enforcement, user authentication, and real-time messaging.

---

## 🌟 Key Features

1. **Mobile-First UX & Design**
   - Palette: Rose pinks (`#f43f5e`), vibrant reds, soft purples, and deep contrast neutrals.
   - Touch-optimized card swiping with gesture drag, dynamic LIKE/PASS decision stamps, and haptic button controls.
   - Fixed thumb-zone bottom navigation: **Discover**, **Likes**, **Matches**, **Messages**, and **Profile**.
   - Zero-slop, clean typography pairing (**Outfit** for headings + **Plus Jakarta Sans** for body).

2. **Strict 18+ Registration & Authentication**
   - Client and database constraints requiring users to be at least 18 years old.
   - Display name, birth date, gender, preference, short bio, interests, and preferred age range collection.
   - Passwords hashed and managed via Supabase Auth; private features inaccessible prior to authentication.

3. **User Profiles & Photos**
   - Upload, replace, and delete profile photos with client-side file type (JPEG, PNG, WebP) and size validation (max 5MB).
   - Display name, age calculated dynamically from birth date, bio, interests, and city.
   - Private-by-default: precise live GPS or physical addresses are never collected or displayed.

4. **Discover & Swipe Engine**
   - Swipeable cards with pointer and touch drag gesture detection.
   - Strict server and client-side exclusion: logged-in user, blocked users, already interacted (liked or passed) profiles, and existing matches are automatically omitted.
   - Instant discovery filters for age range and gender preferences.
   - Suspended or incomplete profiles are excluded.

5. **Mutual Matching & Celebrations**
   - Atomic database function `record_user_interaction` with ordered user pairs (`user1_id < user2_id`) preventing duplicates.
   - Confetti burst animation upon mutual match with direct "Send a Message" and "Keep Exploring" actions.
   - Safe unmatch capabilities for either participant.

6. **Private Real-Time Chat**
   - Text messaging authorized strictly between mutually matched, unblocked users.
   - Supabase Realtime Postgres change subscriptions (with local BroadcastChannel fallback for multi-tab testing).
   - Conversational icebreaker prompts, message timestamps, delivery status, and safety action menu (report, block, unmatch).
   - No photo/video messaging in v1 for privacy and safety.

7. **Trust, Safety & Moderation**
   - Report reasons: *fake profile*, *harassment*, *scam*, *inappropriate content*, *underage user*, *other*.
   - Priority handling for suspected underage reports.
   - Two-way block and unblock controls.
   - Dedicated Staff Moderation Queue (`is_admin: true`) for auditing and suspending offending accounts.
   - Community guidelines, Terms of Service, Privacy Policy, and permanent account deletion.

8. **Monetization & Plans**
   - **Free Plan**: Profile creation, discovery radar, 20 likes per day quota, mutual matches, and unlimited chat.
   - **Premium Plan ($9.99/mo)**: Unlimited likes, see who liked you with unblurred previews, rewind passes.

---

## 🛠️ Project Structure

```text
├── index.html
├── metadata.json
├── package.json
├── README.md
├── supabase/
│   ├── migrations/
│   │   └── 20250101000000_lovematch_core.sql   # Complete SQL migration with RLS & functions
│   └── seed.sql                                # Sample adult profiles for Supabase
├── src/
│   ├── assets/images/                          # Generated high-fidelity portrait assets
│   ├── components/
│   │   ├── common/
│   │   │   ├── BottomNav.tsx                  # Ergonomic 5-tab mobile navigation
│   │   │   ├── Header.tsx                     # Top brand bar with like counter & status
│   │   │   └── SupabaseSettingsModal.tsx      # In-app Supabase connection & migration tool
│   │   ├── discover/
│   │   │   ├── SwipeCard.tsx                  # Interactive drag/swipe card with decision overlays
│   │   │   └── MatchCelebrationModal.tsx       # Confetti celebration on mutual like
│   │   ├── chat/
│   │   │   └── ChatRoom.tsx                   # Real-time encrypted text messaging
│   │   ├── profile/
│   │   │   └── PhotoUploader.tsx              # Validated photo manager (max 5MB, JPG/PNG/WebP)
│   │   ├── safety/
│   │   │   ├── ReportModal.tsx                # Safety violation reporting dialog
│   │   │   └── SafetyGuidelinesModal.tsx      # Guidelines, Terms, Privacy & Support
│   │   └── monetization/
│   │       └── PremiumModal.tsx               # Free vs Premium plans & checkout gateway
│   ├── context/
│   │   └── AuthContext.tsx                    # Authentication and session state
│   ├── lib/
│   │   ├── databaseService.ts                 # Full database layer (Supabase + persistent engine)
│   │   ├── seedData.ts                        # Verified fictional adult profiles
│   │   ├── supabaseClient.ts                  # Dynamic Supabase client initializer
│   │   ├── types.ts                           # TypeScript domain models
│   │   └── utils.ts                           # Age calculations and file validation
│   ├── pages/
│   │   ├── AdminModerationPage.tsx            # Staff ticket review and user suspension
│   │   ├── AuthPage.tsx                       # 18+ sign-up, login, password reset & demo logins
│   │   ├── DiscoverPage.tsx                   # Swipe radar feed with age/gender filters
│   │   ├── LikesPage.tsx                      # Likes You feed (blurred for free, clear for premium)
│   │   ├── MatchesPage.tsx                    # Grid of mutual matches
│   │   ├── MessagesPage.tsx                   # Conversation list with unread markers
│   │   └── ProfilePage.tsx                    # Bio, photos, city, and account deletion
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── tests/
    └── lovematch.test.ts                      # Unit & security invariant test suite
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Supabase project credentials (obtainable from [Supabase Console](https://database.new) > **Project Settings > API**):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Note: You can also configure or change your Supabase project URL and key directly in the app at runtime by clicking the **Supabase Live / Demo** button in the top bar!)*

### 3. Run Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Paste the contents of `supabase/migrations/20250101000000_lovematch_core.sql` and click **Run**.
3. (Optional) Run `supabase/seed.sql` to populate initial demo adult profiles.

### 4. Run Development Server
```bash
npm run dev
```

---

## 📱 Testing on an Android Phone

1. Start the Vite server with network exposure:
   ```bash
   npm run dev -- --host
   ```
2. The terminal will display your network IP:
   ```text
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.XX:3000/
   ```
3. Connect your Android phone to the same Wi-Fi network and open the `http://192.168.1.XX:3000/` URL in Google Chrome.
4. **Android Chrome Tip**: Tap **Menu (⋮) > Add to Home screen** to run LoveMatch in standalone app mode with native full-screen mobile gestures!

---

## 🧪 Running Automated Tests

Run the comprehensive security and logic test suite:
```bash
npm test
```
The test suite validates:
- **Age Validation**: 18+ adult boundary enforcement and rejection of underage birthdates.
- **Mutual Matching**: Atomic pair creation, prevention of self-likes, and canonical ordering (`user1_id < user2_id`).
- **Discovery Exclusions**: Exclusion of self, blocked users, previous likes, and active matches.
- **Chat Authorization**: Sender/receiver authorization and block enforcement.
