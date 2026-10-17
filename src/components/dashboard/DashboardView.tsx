import React, { useState, useMemo, useEffect } from 'react';
import { useMatchStore } from '../../store/useMatchStore';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Header } from './Header';
import { OnCourtZone } from './OnCourtZone';
import { UpNextZone } from './UpNextZone';
import { BenchZone } from './BenchZone';
import { ScoreModal } from '../modals/ScoreModal';
import { EditMatchModal } from '../modals/EditMatchModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { ManualMatchModal } from '../modals/ManualMatchModal';

export const DashboardView: React.FC = () => {
  const {
    config,
    players,
    matches,
    addPlayer,
    togglePlayerActive,
    startMatch,
    completeMatch,
    reshuffleUpcoming,
    updateMatchLineup,
    reassignMatchCourt,
    syncQueue,
    endSession,
    resetSession,
    createManualMatch,
    setPlayerPartner,
  } = useMatchStore();

  // Run queue sync on dashboard load to auto-balance any idle courts
  useEffect(() => {
    syncQueue();
  }, [syncQueue]);

  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);
  const [editingLineupMatch, setEditingLineupMatch] = useState<Match | null>(null);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [manualMatchTargetCourt, setManualMatchTargetCourt] = useState<string | null>(null);
  const [isEndSessionConfirmOpen, setIsEndSessionConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Quick lookup map for players
  const playersById = useMemo(() => {
    const map = new Map<string, SessionPlayer>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  const inProgressMatches = useMemo(
    () => matches.filter((m) => m.status === 'IN_PROGRESS'),
    [matches]
  );

  const upcomingMatches = useMemo(
    () => matches.filter((m) => m.status === 'UPCOMING'),
    [matches]
  );

  const inProgressCourts = useMemo(
    () => new Set(inProgressMatches.map((m) => m.courtName)),
    [inProgressMatches]
  );

  const handleEndMatch = (match: Match) => {
    setActiveScoreMatch(match);
  };

  const handleSaveScore = (matchId: string, scoreA: number, scoreB: number) => {
    completeMatch(matchId, scoreA, scoreB);
    setActiveScoreMatch(null);
  };

  const handleConfirmEndSession = () => {
    setIsEndSessionConfirmOpen(false);
    endSession();
  };

  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    resetSession();
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <Header
        onOpenEndSessionConfirm={() => setIsEndSessionConfirmOpen(true)}
        onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Zone 1: On Court Now */}
        <OnCourtZone
          courts={config.courtNames}
          inProgressMatches={inProgressMatches}
          playersById={playersById}
          onEndMatch={handleEndMatch}
          onManualMatch={(court) => {
            setManualMatchTargetCourt(court || config.courtNames[0]);
            setIsManualMatchOpen(true);
          }}
        />

        {/* Zone 2: Up Next Queue */}
        <UpNextZone
          upcomingMatches={upcomingMatches}
          inProgressCourts={inProgressCourts}
          allCourts={config.courtNames}
          playersById={playersById}
          onStartMatch={startMatch}
          onReshuffle={reshuffleUpcoming}
          onEditLineup={(match) => setEditingLineupMatch(match)}
          onReassignCourt={reassignMatchCourt}
        />

        {/* Zone 3: The Bench & Roster */}
        <BenchZone
          players={players}
          matches={matches}
          onAddPlayer={addPlayer}
          onToggleActive={togglePlayerActive}
          onSetPartner={setPlayerPartner}
        />
      </main>

      {/* Manual Match: Put Players Directly On Court */}
      <ManualMatchModal
        isOpen={isManualMatchOpen}
        defaultCourtName={manualMatchTargetCourt || config.courtNames[0]}
        courtNames={config.courtNames}
        players={players}
        matches={matches}
        onClose={() => setIsManualMatchOpen(false)}
        onCreateMatch={createManualMatch}
      />

      {/* Score Logging Modal */}
      <ScoreModal
        isOpen={activeScoreMatch !== null}
        match={activeScoreMatch}
        pointFormat={config.pointFormat}
        playersById={playersById}
        onClose={() => setActiveScoreMatch(null)}
        onSaveScore={handleSaveScore}
      />

      {/* Manual Lineup Editing Modal */}
      <EditMatchModal
        isOpen={editingLineupMatch !== null}
        match={editingLineupMatch}
        players={players}
        matches={matches}
        courtNames={config.courtNames}
        onClose={() => setEditingLineupMatch(null)}
        onSaveLineup={(matchId, teamA, teamB, courtName) => {
          updateMatchLineup(matchId, teamA, teamB);
          if (courtName) {
            reassignMatchCourt(matchId, courtName);
          }
        }}
        onMarkAway={(playerId) => {
          togglePlayerActive(playerId);
        }}
      />

      {/* End Session Confirmation */}
      <ConfirmModal
        isOpen={isEndSessionConfirmOpen}
        title="End Today's Session?"
        message={`Conclude today's session? You will view the final leaderboard, player superlatives (MVP, workhorse), and get a shareable summary & JSON backup for future phases.${
          inProgressMatches.length > 0
            ? ` Note: There are currently ${inProgressMatches.length} match(es) still marked on court.`
            : ''
        }`}
        confirmLabel="Wrap Up Session"
        onConfirm={handleConfirmEndSession}
        onCancel={() => setIsEndSessionConfirmOpen(false)}
      />

      {/* Reset Session Confirmation */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Session?"
        message="Are you sure you want to completely clear today's session? All current matches will be cleared and games played counters reset for a new session."
        confirmLabel="Reset Session"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
