import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Shuffle,
  UserPlus,
  Users,
  Trophy,
  Sparkles,
  CheckCircle2,
  Coffee,
  Trash2,
  Edit3,
  PlayCircle,
  Info,
} from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Header } from './Header';
import { BenchZone } from './BenchZone';
import { ScoreModal } from '../modals/ScoreModal';
import { EditMatchModal } from '../modals/EditMatchModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { ManualMatchModal } from '../modals/ManualMatchModal';
import { Leaderboard } from '../history/Leaderboard';
import { ElapsedTimer } from '../common/ElapsedTimer';
import { formatDuration } from '../../utils/time';
import { playSuccessSound } from '../../utils/sound';
import { planSessionSchedule } from '../../utils/matchmaker';

export const DashboardView: React.FC = () => {
  const {
    config,
    players,
    matches,
    addPlayer,
    togglePlayerActive,
    startMatch,
    completeMatch,
    deleteMatch,
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

  // Modals & Panels State
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);
  const [editingLineupMatch, setEditingLineupMatch] = useState<Match | null>(null);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [manualMatchTargetCourt, setManualMatchTargetCourt] = useState<string | null>(null);
  const [isEndSessionConfirmOpen, setIsEndSessionConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [matchToCancel, setMatchToCancel] = useState<Match | null>(null);

  // Quick Action Toggles
  const [showBench, setShowBench] = useState<boolean>(false);
  const [showStandings, setShowStandings] = useState<boolean>(false);
  const [plannerMatchCount, setPlannerMatchCount] = useState<number>(8);

  // Quick lookup map for players
  const playersById = useMemo(() => {
    const map = new Map<string, SessionPlayer>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p.name])),
    [players]
  );

  const completedMatches = useMemo(
    () => matches.filter((m) => m.status === 'COMPLETED'),
    [matches]
  );

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

  const activePlayingPlayerIds = useMemo(() => {
    const set = new Set<string>();
    inProgressMatches.forEach((m) => {
      m.teamA.forEach((id) => set.add(id));
      m.teamB.forEach((id) => set.add(id));
    });
    return set;
  }, [inProgressMatches]);

  // Projected & Planned Sequence
  const sessionPlan = useMemo(() => {
    const startIndex = completedMatches.length + inProgressMatches.length + 1;
    const historyEntries = [...completedMatches, ...inProgressMatches].map((m) => ({
      courtName: m.courtName,
      teamA: m.teamA,
      teamB: m.teamB,
    }));

    return planSessionSchedule(
      players,
      {
        totalMatches: plannerMatchCount,
        sessionDurationMinutes: config.bookingDurationMinutes,
        matchDurationMinutes: 15,
        courtNames: config.courtNames,
        startIndex,
        upcomingMatches: upcomingMatches.map((m) => ({
          courtName: m.courtName,
          teamA: m.teamA,
          teamB: m.teamB,
        })),
      },
      historyEntries
    );
  }, [
    players,
    config.courtNames,
    config.bookingDurationMinutes,
    completedMatches,
    inProgressMatches,
    upcomingMatches,
    plannerMatchCount,
  ]);

  // Minimum Effort 1-Click Winner Score Logging
  const handle1ClickWin = (match: Match, winningTeam: 'A' | 'B') => {
    const pointFormat = config.pointFormat;
    const winningScore = pointFormat;
    const losingScore = Math.max(0, pointFormat - 2);

    playSuccessSound();
    if (winningTeam === 'A') {
      completeMatch(match.id, winningScore, losingScore);
    } else {
      completeMatch(match.id, losingScore, winningScore);
    }
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

  const activePlayersCount = players.filter((p) => p.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header
        onOpenEndSessionConfirm={() => setIsEndSessionConfirmOpen(true)}
        onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Quick Action Control Bar (Separated from Primary Schedule Flow) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => syncQueue(true)}
              title="Re-balance and shuffle bench combinations"
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-slate-700/80 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span>Quick Shuffle Bench</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setManualMatchTargetCourt(config.courtNames[0]);
                setIsManualMatchOpen(true);
              }}
              title="Assign specific players manually to a court"
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-2 border border-slate-700/80 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Manual Court Assignment</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBench((v) => !v)}
              aria-expanded={showBench}
              className={`min-h-[48px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                showBench
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Roster &amp; Bench ({activePlayersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowStandings((v) => !v)}
              aria-expanded={showStandings}
              className={`min-h-[48px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                showStandings
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-950/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Standings</span>
            </button>
          </div>
        </div>

        {/* Collapsible Section 1: Roster & Bench Zone */}
        {showBench && (
          <div className="animate-in fade-in duration-200">
            <BenchZone
              players={players}
              matches={matches}
              onAddPlayer={addPlayer}
              onToggleActive={togglePlayerActive}
              onSetPartner={setPlayerPartner}
            />
          </div>
        )}

        {/* Collapsible Section 2: Live Leaderboard / Standings */}
        {showStandings && (
          <div className="animate-in fade-in duration-200">
            <Leaderboard players={players} completedMatches={completedMatches} />
          </div>
        )}

        {/* ============================================================== */}
        {/* PRIMARY FLOW: SCHEDULE-FIRST STREAM                            */}
        {/* ============================================================== */}
        <div className="space-y-6">
          {/* Priority 1: Completed Matches Log Table (Top of Schedule) */}
          <section className="space-y-3" aria-labelledby="completed-log-heading">
            <div className="flex items-center justify-between">
              <h2
                id="completed-log-heading"
                className="text-base font-bold text-slate-100 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1. Played Matches ({completedMatches.length})</span>
              </h2>
              <span className="text-xs text-slate-400 font-semibold">
                {completedMatches.length} Finished
              </span>
            </div>

            {completedMatches.length === 0 ? (
              <div className="text-center py-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-xs">
                No matches completed yet. When games finish, their results, scores, and revert options will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3.5 text-center w-12">#</th>
                      <th className="py-3 px-3">Court</th>
                      <th className="py-3 px-3 text-right">Team A</th>
                      <th className="py-3 px-2 text-center w-24">Score</th>
                      <th className="py-3 px-3 text-left">Team B</th>
                      <th className="py-3 px-3 text-center hidden sm:table-cell">Duration</th>
                      <th className="py-3 px-3 text-center">Result</th>
                      <th className="py-3 px-3 text-center w-16">Revert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {completedMatches.map((m, idx) => {
                      const a1 = playerMap.get(m.teamA[0]) || 'Player 1';
                      const a2 = playerMap.get(m.teamA[1]) || 'Player 2';
                      const b1 = playerMap.get(m.teamB[0]) || 'Player 3';
                      const b2 = playerMap.get(m.teamB[1]) || 'Player 4';

                      const scoreA = m.scoreA ?? 0;
                      const scoreB = m.scoreB ?? 0;
                      const teamAWon = scoreA > scoreB;

                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-300">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{m.courtName}</span>
                              {m.isManualLineup && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Manual
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={`py-3 px-3 text-right ${
                              teamAWon ? 'font-bold text-emerald-400' : 'text-slate-300'
                            }`}
                          >
                            <div>{a1}</div>
                            <div className="text-[11px] opacity-80">{a2}</div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 font-mono font-black text-xs border border-slate-800">
                              <span className={teamAWon ? 'text-emerald-400' : 'text-slate-300'}>
                                {scoreA}
                              </span>
                              <span className="text-slate-600">-</span>
                              <span className={!teamAWon ? 'text-sky-400' : 'text-slate-300'}>
                                {scoreB}
                              </span>
                            </span>
                          </td>
                          <td
                            className={`py-3 px-3 text-left ${
                              !teamAWon ? 'font-bold text-sky-400' : 'text-slate-300'
                            }`}
                          >
                            <div>{b1}</div>
                            <div className="text-[11px] opacity-80">{b2}</div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400 font-mono hidden sm:table-cell">
                            {formatDuration(m.startTime, m.endTime)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                teamAWon
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              }`}
                            >
                              {teamAWon ? 'Team A Won' : 'Team B Won'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setMatchToDelete(m)}
                              className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete match and revert player stats"
                              aria-label={`Delete match ${idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Priority 2: Active on Court Matches (With 1-Click Minimum-Effort Scoring) */}
          <section className="space-y-3" aria-labelledby="active-courts-heading">
            <div className="flex items-center justify-between">
              <h2
                id="active-courts-heading"
                className="text-base font-bold text-slate-100 flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>2. Active On Court ({inProgressMatches.length}/{config.courtNames.length})</span>
              </h2>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {inProgressMatches.length} Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.courtNames.map((court) => {
                const match = inProgressMatches.find((m) => m.courtName === court);

                if (!match) {
                  return (
                    <div
                      key={`open-${court}`}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <span className="font-bold text-slate-300">{court}</span>
                        <span className="text-slate-500">• Open Court</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setManualMatchTargetCourt(court);
                          setIsManualMatchOpen(true);
                        }}
                        className="min-h-[48px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer"
                      >
                        Put Players on Court
                      </button>
                    </div>
                  );
                }

                const a1 = playerMap.get(match.teamA[0]) || 'Player 1';
                const a2 = playerMap.get(match.teamA[1]) || 'Player 2';
                const b1 = playerMap.get(match.teamB[0]) || 'Player 3';
                const b2 = playerMap.get(match.teamB[1]) || 'Player 4';

                return (
                  <div
                    key={match.id}
                    className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl shadow-emerald-950/20"
                  >
                    {/* Court Header & Timer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-black text-slate-100 text-sm tracking-tight">
                          {court}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          LIVE
                        </span>
                      </div>

                      <div className="bg-slate-950/90 px-3 py-1 rounded-xl border border-slate-800 min-h-[36px] flex items-center">
                        <ElapsedTimer startTime={match.startTime} />
                      </div>
                    </div>

                    {/* Clash Lineup */}
                    <div className="grid grid-cols-5 items-center gap-2 py-1 text-center">
                      <div className="col-span-2 bg-slate-950/90 rounded-xl p-2.5 border border-emerald-500/30 shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                          Team A
                        </span>
                        <p className="text-xs sm:text-sm font-black text-slate-100 truncate">
                          {a1}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-slate-100 truncate">
                          {a2}
                        </p>
                      </div>

                      <div className="col-span-1 text-slate-500 font-black text-xs uppercase tracking-wider">
                        vs
                      </div>

                      <div className="col-span-2 bg-slate-950/90 rounded-xl p-2.5 border border-sky-500/30 shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                          Team B
                        </span>
                        <p className="text-xs sm:text-sm font-black text-slate-100 truncate">
                          {b1}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-slate-100 truncate">
                          {b2}
                        </p>
                      </div>
                    </div>

                    {/* Minimal-Effort 1-Click Score Logging */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                        ⚡ 1-Click Winner Logging
                      </span>
                      <div className="flex items-center gap-2">
                        {/* 1-Tap Team A Win */}
                        <button
                          type="button"
                          onClick={() => handle1ClickWin(match, 'A')}
                          title={`Log 1-Click Team A Win (${config.pointFormat}-${Math.max(0, config.pointFormat - 2)})`}
                          className="min-h-[48px] flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30 active:scale-95 transition-all cursor-pointer"
                        >
                          <span>🏆 A Won ({config.pointFormat}-{Math.max(0, config.pointFormat - 2)})</span>
                        </button>

                        {/* 1-Tap Team B Win */}
                        <button
                          type="button"
                          onClick={() => handle1ClickWin(match, 'B')}
                          title={`Log 1-Click Team B Win (${Math.max(0, config.pointFormat - 2)}-${config.pointFormat})`}
                          className="min-h-[48px] flex-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-sky-950/30 active:scale-95 transition-all cursor-pointer"
                        >
                          <span>🏆 B Won ({Math.max(0, config.pointFormat - 2)}-{config.pointFormat})</span>
                        </button>

                        {/* Custom Score Steppers Modal */}
                        <button
                          type="button"
                          onClick={() => setActiveScoreMatch(match)}
                          title="Enter custom score or deuce with +/- steppers"
                          aria-label={`Enter custom score for ${court}`}
                          className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Cancel / Discard Live Match */}
                        <button
                          type="button"
                          onClick={() => setMatchToCancel(match)}
                          title="Cancel live match and free court"
                          aria-label={`Cancel match on ${court}`}
                          className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Priority 3: Upcoming & Projected Sequence (Bottom of Schedule List) */}
          <section className="space-y-4" aria-labelledby="projected-schedule-heading">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <h2
                    id="projected-schedule-heading"
                    className="text-base font-bold text-slate-100"
                  >
                    3. Upcoming &amp; Projected Sequence
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Fair rotation sequence maximizing combinations and tracking rest periods.
                </p>
              </div>

              {/* Sequence Length Controls */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {[6, 8, 10, 12].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPlannerMatchCount(count)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      plannerMatchCount === count
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {count} M
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Constraint Metrics Bar */}
            {sessionPlan.validation.isFeasible && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Variety: {sessionPlan.validation.metrics.varietyScorePercent}%
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Spread: {sessionPlan.validation.metrics.minGamesPerPlayer}–{sessionPlan.validation.metrics.maxGamesPerPlayer} games
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Back-to-Back: {sessionPlan.validation.metrics.backToBackCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Unique Pairs: {sessionPlan.validation.metrics.uniquePartnerPairsCount}/{sessionPlan.validation.metrics.totalPossiblePairsCount}
                </span>
              </div>
            )}

            {/* Mathematical Notes */}
            {sessionPlan.validation.warnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Scheduling Rule Notes</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                  {sessionPlan.validation.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {sessionPlan.schedule.length === 0 ? (
              <div className="text-center py-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-xs">
                Add at least 4 active players to generate upcoming match rotation.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3 w-28">Time Slot</th>
                      <th className="py-3 px-3">Court</th>
                      <th className="py-3 px-3 text-right">Team A</th>
                      <th className="py-3 px-2 text-center w-10 text-slate-500">vs</th>
                      <th className="py-3 px-3 text-left">Team B</th>
                      <th className="py-3 px-3">
                        <div className="flex items-center gap-1 text-amber-300">
                          <Coffee className="w-3.5 h-3.5" />
                          <span>Resting on Bench</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center w-36">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {sessionPlan.schedule.map((m) => {
                      const a1 = playerMap.get(m.teamA[0]) || 'Player 1';
                      const a2 = playerMap.get(m.teamA[1]) || 'Player 2';
                      const b1 = playerMap.get(m.teamB[0]) || 'Player 3';
                      const b2 = playerMap.get(m.teamB[1]) || 'Player 4';

                      const restingNames = m.restingPlayerIds
                        .map((id) => playerMap.get(id))
                        .filter(Boolean);

                      // Match is queued if an active match object exists with status UPCOMING
                      const liveQueuedMatch = upcomingMatches.find(
                        (up) =>
                          up.courtName === m.courtName &&
                          up.teamA[0] === m.teamA[0] &&
                          up.teamA[1] === m.teamA[1]
                      );

                      const isCourtOccupied = inProgressCourts.has(m.courtName);
                      const hasBusyPlayer = [...m.teamA, ...m.teamB].some((id) =>
                        activePlayingPlayerIds.has(id)
                      );
                      const canStartNow = Boolean(liveQueuedMatch) && !isCourtOccupied && !hasBusyPlayer;

                      return (
                        <tr
                          key={`proj-${m.matchNumber}-${m.courtName}`}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            m.isQueued ? 'bg-amber-400/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                            #{m.matchNumber}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-400 text-[11px] whitespace-nowrap">
                            {m.timeSlot || '—'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {m.courtName}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-emerald-300">
                            <div>{a1}</div>
                            <div className="text-[11px] text-slate-400">{a2}</div>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-500 font-bold uppercase text-[10px]">
                            vs
                          </td>
                          <td className="py-3 px-3 text-left font-medium text-sky-300">
                            <div>{b1}</div>
                            <div className="text-[11px] text-slate-400">{b2}</div>
                          </td>
                          <td className="py-3 px-3">
                            {restingNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {restingNames.map((name) => (
                                  <span
                                    key={name}
                                    className="inline-block px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] border border-slate-800"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {liveQueuedMatch ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={!canStartNow}
                                  onClick={() => startMatch(liveQueuedMatch.id)}
                                  title={
                                    isCourtOccupied
                                      ? `${m.courtName} is busy`
                                      : hasBusyPlayer
                                      ? 'Player playing on other court'
                                      : 'Start match on court'
                                  }
                                  className={`min-h-[48px] px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                    canStartNow
                                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                                  }`}
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span>Start</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => reshuffleUpcoming(liveQueuedMatch.id)}
                                  title="Reshuffle teams"
                                  className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Shuffle className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingLineupMatch(liveQueuedMatch)}
                                  title="Edit lineup"
                                  className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteMatch(liveQueuedMatch.id)}
                                  title="Discard upcoming match"
                                  className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Planned
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Manual Match Modal */}
      <ManualMatchModal
        isOpen={isManualMatchOpen}
        defaultCourtName={manualMatchTargetCourt || config.courtNames[0]}
        courtNames={config.courtNames}
        players={players}
        matches={matches}
        onClose={() => setIsManualMatchOpen(false)}
        onCreateMatch={createManualMatch}
      />

      {/* Full Score Adjuster Modal */}
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

      {/* Delete / Revert Completed Match Confirmation */}
      {matchToDelete && (
        <ConfirmModal
          isOpen={Boolean(matchToDelete)}
          title="Delete Match Record?"
          message="Are you sure you want to delete this match record? Player statistics (games played, win/loss, points) will be automatically reverted and rotation wait states safely restored."
          confirmLabel="Delete Match"
          onConfirm={() => {
            deleteMatch(matchToDelete.id);
            setMatchToDelete(null);
          }}
          onCancel={() => setMatchToDelete(null)}
        />
      )}

      {/* Cancel Live Match Confirmation */}
      {matchToCancel && (
        <ConfirmModal
          isOpen={Boolean(matchToCancel)}
          title="Cancel Live Match?"
          message={`Are you sure you want to cancel the match on ${matchToCancel.courtName}? The court and all 4 players will be freed immediately without saving scores.`}
          confirmLabel="Cancel Match"
          onConfirm={() => {
            deleteMatch(matchToCancel.id);
            setMatchToCancel(null);
          }}
          onCancel={() => setMatchToCancel(null)}
        />
      )}

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
