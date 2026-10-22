import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { ArrowLeft, Users } from 'lucide-react';
import { useMatchStore } from './store/useMatchStore';
import { useTournamentStore } from './store/useTournamentStore';
import { SetupView } from './components/setup/SetupView';
import { DashboardView } from './components/dashboard/DashboardView';
import { MatchHistoryView } from './components/history/MatchHistoryView';
import { SessionSummaryView } from './components/history/SessionSummaryView';
import { ModeSelector } from './components/hub/ModeSelector';
import { TournamentDashboard } from './components/tournament/TournamentDashboard';
import { TournamentSetupView } from './components/tournament/TournamentSetupView';
import { SpectatorView } from './components/tournament/SpectatorView';

export type AppMode = 'HUB' | 'DAILY_PLAY' | 'TOURNAMENT' | 'SPECTATOR';

const MODE_STORAGE_KEY = 'equiplay-active-app-mode';

export const App: React.FC = () => {
  const currentDailyView = useMatchStore((state) => state.currentView);
  const tournamentStatus = useTournamentStore((state) => state.config.status);

  // Parse URL search params for spectator mode (?tournamentId=ebc-2026&view=spectator)
  const [spectatorTournamentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const tid = params.get('tournamentId');
      if (view === 'spectator' && tid) {
        return tid;
      }
    }
    return null;
  });

  // AppMode with localStorage persistence
  const [mode, setMode] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'spectator' && params.get('tournamentId')) {
        return 'SPECTATOR';
      }
      const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY) as AppMode | null;
      if (savedMode && ['HUB', 'DAILY_PLAY', 'TOURNAMENT'].includes(savedMode)) {
        return savedMode;
      }
    }
    return 'HUB';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && mode !== 'SPECTATOR') {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  }, [mode]);

  // FIX: Reset window scroll and unlock body scroll whenever mode or major view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = '';
  }, [mode, currentDailyView, tournamentStatus]);

  const renderDailyPlayView = () => {
    switch (currentDailyView) {
      case 'SETUP':
        return <SetupView />;
      case 'DASHBOARD':
        return <DashboardView />;
      case 'HISTORY':
        return <MatchHistoryView />;
      case 'SUMMARY':
        return <SessionSummaryView />;
      default:
        return <SetupView />;
    }
  };

  return (
    <>
      {mode === 'HUB' && (
        <ModeSelector onSelectMode={(newMode) => setMode(newMode)} />
      )}

      {mode === 'DAILY_PLAY' && (
        <div className="min-h-screen bg-slate-950 flex flex-col">
          {/* Top Navigation Bar: Clean Single Mode Switcher */}
          <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMode('HUB')}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Mode Hub</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Casual Daily</span>
              </div>
            </div>
          </div>

          <div className="flex-1">{renderDailyPlayView()}</div>
        </div>
      )}

      {mode === 'TOURNAMENT' && (
        tournamentStatus === 'SETUP' ? (
          <TournamentSetupView
            onSwitchMode={() => setMode('HUB')}
          />
        ) : (
          <TournamentDashboard
            onSwitchMode={() => setMode('HUB')}
          />
        )
      )}

      {mode === 'SPECTATOR' && spectatorTournamentId && (
        <SpectatorView tournamentId={spectatorTournamentId} />
      )}

      <Analytics />
    </>
  );
};

export default App;
