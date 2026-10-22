import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Calendar,
  BarChart3,
  Layers,
  Users,
  MapPin,
  Flame,
  Settings,
  Lock,
  QrCode,
  Sliders,
} from 'lucide-react';
import {
  TournamentMatch,
  TournamentTeam,
} from '../../types/tournament';
import { useTournamentStore } from '../../store/useTournamentStore';
import { FixturesTab } from './FixturesTab';
import { StandingsTab } from './StandingsTab';
import { BracketTab } from './BracketTab';
import { RosterTab } from './RosterTab';
import { ScoreModal } from './ScoreModal';
import { TeamEditModal } from './TeamEditModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { TournamentSettingsModal } from './TournamentSettingsModal';
import { ShareLiveModal } from './ShareLiveModal';
import { getTournamentTeam } from '../../utils/tournamentEngine';

interface TournamentDashboardProps {
  onSwitchMode: () => void;
}

export const TournamentDashboard: React.FC<TournamentDashboardProps> = ({
  onSwitchMode,
}) => {
  const {
    tournamentId,
    config,
    settings,
    matches,
    teams,
    courts,
    syncStatus,
    activeTab,
    selectedCourtFilter,
    setActiveTab,
    setSelectedCourtFilter,
    completeMatch,
    editMatchScore,
    addTeam,
    updateTeamName,
    resetTournament,
    returnToSetup,
    setSettings,
  } = useTournamentStore();

  // Scroll reset on tab changes or mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = '';
  }, [activeTab]);

  // Modals state
  const [activeScoreMatch, setActiveScoreMatch] = useState<TournamentMatch | null>(null);
  const [activeEditTeam, setActiveEditTeam] = useState<TournamentTeam | null>(null);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Tournament progress metrics
  const hasStarted = matches.some((m) => m.status !== 'UPCOMING');
  const groupMatches = matches.filter((m) => m.stage === 'GROUP');
  const completedGroupMatches = groupMatches.filter((m) => m.status === 'COMPLETED').length;
  const totalCompletedMatches = matches.filter((m) => m.status === 'COMPLETED').length;
  const groupProgressPercent = Math.round((completedGroupMatches / groupMatches.length) * 100);

  const handleSaveScore = (matchId: string, scoreA: number, scoreB: number) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    if (targetMatch.status === 'COMPLETED') {
      editMatchScore(matchId, scoreA, scoreB);
    } else {
      completeMatch(matchId, scoreA, scoreB);
    }
  };

  const handleConfirmReset = () => {
    resetTournament();
    setIsResetConfirmOpen(false);
  };

  const selectedTeamA = activeScoreMatch
    ? getTournamentTeam(activeScoreMatch.teamAId, teams)
    : undefined;
  const selectedTeamB = activeScoreMatch
    ? getTournamentTeam(activeScoreMatch.teamBId, teams)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          {/* Top Row: Switch Mode, Title & Reset */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Left: Mode Hub & Sync Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onSwitchMode}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Mode Hub</span>
              </button>

              {/* Sync Status Indicator */}
              <div
                title={
                  syncStatus === 'SYNCED'
                    ? 'Synced with local & network nodes'
                    : syncStatus === 'PENDING'
                    ? 'Syncing changes...'
                    : 'Offline - Changes safely saved locally'
                }
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold"
              >
                {syncStatus === 'SYNCED' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-emerald-400 hidden xs:inline">Synced</span>
                  </>
                )}
                {syncStatus === 'PENDING' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-amber-400 hidden xs:inline">Syncing...</span>
                  </>
                )}
                {syncStatus === 'LOCAL' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-400 hidden xs:inline">Offline (Saved)</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Rules Settings, Share Board, Setup & Reset Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                title="Share live spectator QR board with players"
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all cursor-pointer active:scale-95"
              >
                <QrCode className="w-4 h-4 stroke-[2.5]" />
                <span>Share Live Board</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                title="Official EBC rules, court names, and tie-breakers"
                className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasStarted) return;
                  returnToSetup();
                }}
                disabled={hasStarted}
                title={
                  hasStarted
                    ? 'Setup is locked because tournament matches have already started. Reset tournament to reconfigure.'
                    : 'Configure tournament format, match rules, or teams'
                }
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  hasStarted
                    ? 'bg-slate-900/50 text-slate-500 border-slate-800/60 cursor-not-allowed opacity-70'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border-slate-800 cursor-pointer'
                }`}
              >
                {hasStarted ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  <Settings className="w-4 h-4 text-emerald-400" />
                )}
                <span className="hidden sm:inline">
                  {hasStarted ? 'Setup Locked' : 'Format'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                aria-label="Reset Tournament"
                title="Reset Tournament to seeded state"
                className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Progress Bar & Quick Court Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
            {/* Progress Stats */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Group Stage Progress</span>
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {completedGroupMatches}/{groupMatches.length} Group ({totalCompletedMatches}/{matches.length} Total)
                  </span>
                </div>
                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${groupProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Court Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Court:</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourtFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  selectedCourtFilter === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {courts.map((court) => (
                <button
                  key={court}
                  type="button"
                  onClick={() => setSelectedCourtFilter(court)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCourtFilter === court
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {court}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Tabbed Arena */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* Navigation Tabs */}
        <nav
          role="tablist"
          className="grid grid-cols-4 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800"
        >
          {/* Tab 1: Fixtures */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'FIXTURES'}
            onClick={() => setActiveTab('FIXTURES')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              activeTab === 'FIXTURES'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden xs:inline">Fixtures</span>
          </button>

          {/* Tab 2: Standings */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'STANDINGS'}
            onClick={() => setActiveTab('STANDINGS')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              activeTab === 'STANDINGS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden xs:inline">Standings</span>
          </button>

          {/* Tab 3: Bracket */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'BRACKET'}
            onClick={() => setActiveTab('BRACKET')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              activeTab === 'BRACKET'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden xs:inline">Knockouts</span>
          </button>

          {/* Tab 4: Roster */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ROSTER'}
            onClick={() => setActiveTab('ROSTER')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              activeTab === 'ROSTER'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden xs:inline">Roster (32)</span>
          </button>
        </nav>

        {/* Tab Content Panels */}
        <section className="pt-2">
          {activeTab === 'FIXTURES' && (
            <FixturesTab onOpenScoreModal={(match) => setActiveScoreMatch(match)} />
          )}

          {activeTab === 'STANDINGS' && <StandingsTab />}

          {activeTab === 'BRACKET' && (
            <BracketTab onOpenScoreModal={(match) => setActiveScoreMatch(match)} />
          )}

          {activeTab === 'ROSTER' && (
            <RosterTab
              onOpenEditModal={(team) => setActiveEditTeam(team)}
              onOpenAddModal={() => setIsAddTeamModalOpen(true)}
            />
          )}
        </section>
      </main>

      {/* Courtside Score Logging Modal */}
      <ScoreModal
        isOpen={!!activeScoreMatch}
        match={activeScoreMatch}
        teamA={selectedTeamA}
        teamB={selectedTeamB}
        onClose={() => setActiveScoreMatch(null)}
        onSave={handleSaveScore}
      />

      {/* Team Roster Edit Modal (Existing team) */}
      <TeamEditModal
        isOpen={!!activeEditTeam}
        team={activeEditTeam}
        isMatchStarted={hasStarted}
        onClose={() => setActiveEditTeam(null)}
        onSave={(teamId, p1, p2, alias, group) =>
          updateTeamName(teamId, p1, p2, alias, group)
        }
      />

      {/* Add New Team Modal */}
      <TeamEditModal
        isOpen={isAddTeamModalOpen}
        team={null}
        onClose={() => setIsAddTeamModalOpen(false)}
        onSave={(_id, p1, p2, alias, group) => {
          addTeam({ player1: p1, player2: p2, alias, group });
          setIsAddTeamModalOpen(false);
        }}
      />

      {/* Confirm Reset Tournament Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Tournament?"
        message="This will reset all group stage scores, knockout brackets, and return the tournament to its initial 32-team seeded fixtures. This cannot be undone."
        confirmLabel="Reset All Matches"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Official Tournament Settings Modal */}
      <TournamentSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={(updated) => setSettings(updated)}
      />

      {/* Share Live Board & QR Modal */}
      <ShareLiveModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tournamentId={tournamentId}
        tournamentName={settings.tournamentName || config.name}
        matches={matches}
        teams={teams}
      />
    </div>
  );
};
