import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { LikesPage } from './pages/LikesPage';
import { MatchesPage } from './pages/MatchesPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminModerationPage } from './pages/AdminModerationPage';

import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { ChatRoom } from './components/chat/ChatRoom';
import { ReportModal } from './components/safety/ReportModal';
import { SafetyGuidelinesModal } from './components/safety/SafetyGuidelinesModal';
import { SupabaseSettingsModal } from './components/common/SupabaseSettingsModal';
import { PremiumModal } from './components/monetization/PremiumModal';

import { MatchItem, UserProfile } from './lib/types';
import { dbService } from './lib/databaseService';

export default function App() {
  const { currentUser, loading, isSupabaseConnected, refreshUser } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('discover');
  const [activeChatMatch, setActiveChatMatch] = useState<MatchItem | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);

  // Modals state
  const [reportingUserId, setReportingUserId] = useState<string | null>(null);
  const [showSafetyGuidelines, setShowSafetyGuidelines] = useState(false);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!currentUser) return;
    try {
      const sub = await dbService.getSubscription(currentUser.id);
      setIsPremium(sub.tier === 'premium' && sub.status === 'active');
      const matches = await dbService.getMatches(currentUser.id);
      setMatchesCount(matches.length);
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      checkSubscription();
    }
  }, [currentUser, checkSubscription]);

  const handleOpenChatWithUser = async (candidate: UserProfile) => {
    if (!currentUser) return;
    try {
      const matches = await dbService.getMatches(currentUser.id);
      const match = matches.find((m) => m.matched_user.id === candidate.id);
      if (match) {
        setActiveChatMatch(match);
      } else {
        // Fallback match item
        setActiveChatMatch({
          match_id: 'match-' + candidate.id,
          matched_user: candidate,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnmatch = async (matchId: string) => {
    await dbService.unmatch(matchId);
    setActiveChatMatch(null);
    checkSubscription();
  };

  const handleBlock = async (targetUserId: string) => {
    if (!currentUser) return;
    await dbService.blockUser(currentUser.id, targetUserId);
    setActiveChatMatch(null);
    checkSubscription();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-3 border-rose-500 border-t-transparent animate-spin mb-3" />
        <span className="text-xs text-slate-400 font-medium tracking-wide">
          Loading LoveMatch...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* Centered Mobile Container on Desktop / Full Screen on Android */}
      <div className="w-full max-w-md min-h-screen bg-slate-950 flex flex-col justify-between shadow-2xl relative border-x border-slate-900/80">
        {/* Top Header */}
        {!activeChatMatch && !showAdminPortal && (
          <Header
            currentUser={currentUser}
            isSupabaseConnected={isSupabaseConnected}
            onOpenSupabaseSettings={() => setShowSupabaseSettings(true)}
            onOpenSafetyGuidelines={() => setShowSafetyGuidelines(true)}
            onOpenPremium={() => setShowPremiumModal(true)}
            isPremium={isPremium}
          />
        )}

        {/* Dynamic Main Body Content */}
        <main className="flex-1 flex flex-col pb-16">
          {activeChatMatch ? (
            <ChatRoom
              matchId={activeChatMatch.match_id}
              matchedUser={activeChatMatch.matched_user}
              currentUserId={currentUser.id}
              onBack={() => {
                setActiveChatMatch(null);
                checkSubscription();
              }}
              onUnmatch={handleUnmatch}
              onBlock={handleBlock}
              onReport={(id) => setReportingUserId(id)}
            />
          ) : showAdminPortal ? (
            <AdminModerationPage onBack={() => setShowAdminPortal(false)} />
          ) : (
            <>
              {currentTab === 'discover' && (
                <DiscoverPage
                  currentUser={currentUser}
                  isPremium={isPremium}
                  onOpenChat={handleOpenChatWithUser}
                  onReportUser={(id) => setReportingUserId(id)}
                  onOpenPremium={() => setShowPremiumModal(true)}
                  onProfileUpdated={refreshUser}
                />
              )}

              {currentTab === 'likes' && (
                <LikesPage
                  currentUser={currentUser}
                  isPremium={isPremium}
                  onOpenPremium={() => setShowPremiumModal(true)}
                  onMatchCreated={(user) => {
                    handleOpenChatWithUser(user);
                    checkSubscription();
                  }}
                />
              )}

              {currentTab === 'matches' && (
                <MatchesPage
                  currentUser={currentUser}
                  onSelectMatch={(m) => setActiveChatMatch(m)}
                  onGoDiscover={() => setCurrentTab('discover')}
                />
              )}

              {currentTab === 'messages' && (
                <MessagesPage
                  currentUser={currentUser}
                  onSelectMatch={(m) => setActiveChatMatch(m)}
                  onGoDiscover={() => setCurrentTab('discover')}
                />
              )}

              {currentTab === 'profile' && (
                <ProfilePage
                  currentUser={currentUser}
                  isPremium={isPremium}
                  onOpenPremium={() => setShowPremiumModal(true)}
                  onOpenAdminPortal={() => setShowAdminPortal(true)}
                  onProfileUpdated={() => {
                    refreshUser();
                    checkSubscription();
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Fixed Ergonomic Bottom Tab Navigation */}
        {!activeChatMatch && !showAdminPortal && (
          <BottomNav
            currentTab={currentTab}
            onChangeTab={(tab) => {
              setActiveChatMatch(null);
              setShowAdminPortal(false);
              setCurrentTab(tab);
            }}
            matchesCount={matchesCount}
          />
        )}

        {/* Global Safety Report Modal */}
        {reportingUserId && (
          <ReportModal
            reportedUserId={reportingUserId}
            reporterUserId={currentUser.id}
            onClose={() => setReportingUserId(null)}
            onSuccess={() => {
              setReportingUserId(null);
              checkSubscription();
            }}
          />
        )}

        {/* Community Guidelines & Safety Modal */}
        {showSafetyGuidelines && (
          <SafetyGuidelinesModal onClose={() => setShowSafetyGuidelines(false)} />
        )}

        {/* Supabase Connection & SQL Modal */}
        {showSupabaseSettings && (
          <SupabaseSettingsModal
            onClose={() => setShowSupabaseSettings(false)}
            onConfigUpdated={() => {
              refreshUser();
              checkSubscription();
            }}
          />
        )}

        {/* Monetization & Premium Modal */}
        {showPremiumModal && (
          <PremiumModal
            userId={currentUser.id}
            isPremium={isPremium}
            onClose={() => setShowPremiumModal(false)}
            onUpgraded={() => {
              checkSubscription();
              refreshUser();
            }}
          />
        )}
      </div>
    </div>
  );
}
