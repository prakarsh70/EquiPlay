import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Shield,
  Activity,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import {
  GroupId,
  TournamentMatch,
  TournamentState,
} from '../../types/tournament';
import { syncService } from '../../services/syncService';
import { TOURNAMENT_GROUPS } from '../../data/tournamentSeed';
import {
  computeAllStandings,
  formatTeamName,
  getKnockoutSlotPlaceholder,
  getTournamentTeam,
} from '../../utils/tournamentEngine';

interface SpectatorViewProps {
  tournamentId: string;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({ tournamentId }) => {
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'STANDINGS' | 'BRACKET'>('LIVE');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Multi-accordion state: persist which pools are open
  const [expandedGroups, setExpandedGroups] = useState<Set<GroupId>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(`equiplay_spectator_pools_${tournamentId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return new Set(parsed as GroupId[]);
          }
        }
      } catch {
        // Fallback
      }
    }
    // Default: Pool A is open
    return new Set<GroupId>(['A']);
  });

  const toggleGroup = (group: GroupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            `equiplay_spectator_pools_${tournamentId}`,
            JSON.stringify(Array.from(next))
          );
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const expandAllGroups = () => {
    const all = new Set<GroupId>(TOURNAMENT_GROUPS);
    setExpandedGroups(all);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `equiplay_spectator_pools_${tournamentId}`,
        JSON.stringify(Array.from(all))
      );
    }
  };

  const collapseAllGroups = () => {
    const none = new Set<GroupId>();
    setExpandedGroups(none);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `equiplay_spectator_pools_${tournamentId}`,
        JSON.stringify([])
      );
    }
  };

  // Preserve scroll position on user scroll
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`equiplay_spectator_scroll_${tournamentId}`, String(window.scrollY));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tournamentId]);

  // Restore scroll position after initial state is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && tournamentState) {
      const savedScroll = sessionStorage.getItem(`equiplay_spectator_scroll_${tournamentId}`);
      if (savedScroll) {
        const y = parseInt(savedScroll, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: 'instant' });
          });
        }
      }
    }
  }, [tournamentId, !!tournamentState]);

  useEffect(() => {
    // Initial fetch and subscribe
    const unsubscribe = syncService.subscribeToTournament(tournamentId, (state) => {
      setTournamentState(state);
      setLastRefreshed(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, [tournamentId]);

  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setHasConnectionFailed(false);
    const timer = setTimeout(() => {
      setTournamentState((curr) => {
        if (!curr) {
          setHasConnectionFailed(true);
        }
        return curr;
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [tournamentId]);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    setHasConnectionFailed(false);
    try {
      const state = await syncService.getLatestState(tournamentId);
      if (state) {
        setTournamentState(state);
      } else {
        setHasConnectionFailed(true);
      }
    } catch {
      setHasConnectionFailed(true);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!tournamentState) {
    if (hasConnectionFailed) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/20">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-100">Unable to Connect to Live Board</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              No active broadcast could be reached for tournament{' '}
              <code className="text-amber-300 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                "{tournamentId}"
              </code>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <button
              type="button"
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="flex-1 min-h-[46px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Reconnecting...' : 'Retry Connection'}</span>
            </button>
            <a
              href="/?mode=TOURNAMENT"
              className="flex-1 min-h-[46px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <span>Go to Tournament Setup</span>
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse mb-4">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-xl font-black text-slate-100">Connecting to Tournament Live Board...</h2>
        <p className="text-xs text-slate-400 mt-1">ID: {tournamentId}</p>
      </div>
    );
  }

  const { config, settings, teams, matches, courts } = tournamentState;
  const standingsByGroup = computeAllStandings(teams, matches, settings);

  const liveMatches = matches.filter((m) => m.status === 'IN_PROGRESS');
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');
  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      {/* Read-Only Spectator Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-100 tracking-tight">
                  {settings.tournamentName || config.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400">
                  v2.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{settings.venueName || 'Shuttlers Zone, Wakad'}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Auto-Syncing</span>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Pills */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('LIVE')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'LIVE'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Courts ({liveMatches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STANDINGS')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STANDINGS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Pools</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BRACKET')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'BRACKET'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bracket</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 pt-5 space-y-6 flex-1">
        {/* TAB 1: LIVE ON COURT & QUEUED */}
        {activeTab === 'LIVE' && (
          <div className="space-y-6">
            {/* Live On Court Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Live On Court ({liveMatches.length})</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Target: {settings.groupStageFormat.targetPoints} Pts
                </span>
              </div>

              {(() => {
                // Resolve Court-to-Match Mapping for Live On Court display:
                const baseCourts = courts && courts.length > 0 ? courts : ['Court 2', 'Court 3', 'Court 4', 'Court 5'];
                const displayCourtsList = [...baseCourts];
                liveMatches.forEach((m) => {
                  if (m.courtName && m.courtName.trim() && !displayCourtsList.includes(m.courtName.trim())) {
                    displayCourtsList.push(m.courtName.trim());
                  }
                });

                const courtMatchMap = new Map<string, TournamentMatch>();
                const unassignedLiveMatches: TournamentMatch[] = [];

                liveMatches.forEach((m) => {
                  if (m.courtName && displayCourtsList.includes(m.courtName)) {
                    courtMatchMap.set(m.courtName, m);
                  } else {
                    unassignedLiveMatches.push(m);
                  }
                });

                // Auto-map unassigned live matches to any idle courts
                displayCourtsList.forEach((courtName) => {
                  if (!courtMatchMap.has(courtName) && unassignedLiveMatches.length > 0) {
                    const match = unassignedLiveMatches.shift()!;
                    courtMatchMap.set(courtName, match);
                  }
                });

                const overflowLiveMatches = [...unassignedLiveMatches];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {displayCourtsList.map((courtName) => {
                      const activeMatch = courtMatchMap.get(courtName);
                      const teamA = activeMatch ? getTournamentTeam(activeMatch.teamAId, teams) : null;
                      const teamB = activeMatch ? getTournamentTeam(activeMatch.teamBId, teams) : null;

                      const teamAName = teamA
                        ? formatTeamName(teamA)
                        : activeMatch
                        ? getKnockoutSlotPlaceholder(activeMatch.matchCode, 'A')
                        : 'Team A';
                      const teamBName = teamB
                        ? formatTeamName(teamB)
                        : activeMatch
                        ? getKnockoutSlotPlaceholder(activeMatch.matchCode, 'B')
                        : 'Team B';

                      return (
                        <div
                          key={courtName}
                          className={`p-4 rounded-2xl border transition-all ${
                            activeMatch
                              ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                              : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-black font-mono text-slate-200">
                                {courtName}
                              </span>
                              {activeMatch && (
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  {activeMatch.matchCode}
                                </span>
                              )}
                              {activeMatch?.group && (
                                <span className="text-[10px] font-bold text-emerald-400">
                                  Pool {activeMatch.group}
                                </span>
                              )}
                            </div>
                            {activeMatch ? (
                              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                IN PLAY
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">Idle</span>
                            )}
                          </div>

                          {activeMatch ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                                <div className="min-w-0 flex-1 pr-2">
                                  {teamA && (
                                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                                      #{teamA.teamNumber}
                                    </span>
                                  )}
                                  <p className="text-sm font-black text-slate-100 truncate mt-0.5">
                                    {teamAName}
                                  </p>
                                </div>
                                <span className="text-xl font-mono font-black text-emerald-400 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                                  {activeMatch.scoreA ?? 0}
                                </span>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                                <div className="min-w-0 flex-1 pr-2">
                                  {teamB && (
                                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                                      #{teamB.teamNumber}
                                    </span>
                                  )}
                                  <p className="text-sm font-black text-slate-100 truncate mt-0.5">
                                    {teamBName}
                                  </p>
                                </div>
                                <span className="text-xl font-mono font-black text-emerald-400 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                                  {activeMatch.scoreB ?? 0}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-500">
                              Court is currently awaiting next match call
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Render any overflow live matches beyond court count */}
                    {overflowLiveMatches.map((overflowMatch) => {
                      const teamA = getTournamentTeam(overflowMatch.teamAId, teams);
                      const teamB = getTournamentTeam(overflowMatch.teamBId, teams);
                      const teamAName = teamA ? formatTeamName(teamA) : 'Team A';
                      const teamBName = teamB ? formatTeamName(teamB) : 'Team B';

                      return (
                        <div
                          key={overflowMatch.id}
                          className="p-4 rounded-2xl border bg-slate-900 border-amber-500/50 shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-black font-mono">
                              {overflowMatch.courtName || 'Court Active'}
                            </span>
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              IN PLAY
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70">
                              <p className="text-sm font-black text-slate-100 truncate">{teamAName}</p>
                              <span className="text-xl font-mono font-black text-emerald-400 px-3 py-1 rounded-lg bg-slate-900">
                                {overflowMatch.scoreA ?? 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70">
                              <p className="text-sm font-black text-slate-100 truncate">{teamBName}</p>
                              <span className="text-xl font-mono font-black text-emerald-400 px-3 py-1 rounded-lg bg-slate-900">
                                {overflowMatch.scoreB ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Up Next / Queued */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Up Next / Queued Matches</span>
              </h3>

              <div className="space-y-2">
                {upcomingMatches.slice(0, 6).map((match) => {
                  const teamA = getTournamentTeam(match.teamAId, teams);
                  const teamB = getTournamentTeam(match.teamBId, teams);

                  return (
                    <div
                      key={match.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800">
                          {match.matchCode}
                        </span>
                        {match.group && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            Pool {match.group}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-slate-200 text-center flex-1 truncate">
                        <span>{formatTeamName(teamA)}</span>
                        <span className="text-slate-500 mx-2">vs</span>
                        <span>{formatTeamName(teamB)}</span>
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 shrink-0">
                        {match.courtName || 'Court TBD'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Completed Results */}
            {completedMatches.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Recent Results</span>
                </h3>

                <div className="space-y-2">
                  {completedMatches.slice(-4).reverse().map((match) => {
                    const teamA = getTournamentTeam(match.teamAId, teams);
                    const teamB = getTournamentTeam(match.teamBId, teams);
                    const isAWinner = match.winnerTeamId === match.teamAId;

                    return (
                      <div
                        key={match.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-500 text-[10px]">
                          {match.matchCode}
                        </span>
                        <div className="flex-1 px-4 text-center truncate">
                          <span className={isAWinner ? 'font-bold text-emerald-400' : 'text-slate-400'}>
                            {formatTeamName(teamA)} ({match.scoreA})
                          </span>
                          <span className="text-slate-600 mx-2">-</span>
                          <span className={!isAWinner ? 'font-bold text-emerald-400' : 'text-slate-400'}>
                            {formatTeamName(teamB)} ({match.scoreB})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POOL STANDINGS */}
        {activeTab === 'STANDINGS' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllGroups}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer border border-slate-700 active:scale-95"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllGroups}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer border border-slate-700 active:scale-95"
                >
                  Collapse All
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Win: {settings.groupStageFormat.pointsPerWin} Pts</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-bold">Top 2 Qualify for R16</span>
              </div>
            </div>

            {TOURNAMENT_GROUPS.map((group) => {
              const groupStandings = standingsByGroup[group] || [];
              const isExpanded = expandedGroups.has(group);

              return (
                <div
                  key={group}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
                        {group}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-100">
                          Pool {group} Standings
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {groupStandings.filter((s) => s.played > 0).length} of 4 teams played
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-2 pr-2">Team</th>
                            <th className="py-2 px-1.5 text-center">P</th>
                            <th className="py-2 px-1.5 text-center">W</th>
                            <th className="py-2 px-1.5 text-center">L</th>
                            <th className="py-2 px-1.5 text-center">PD</th>
                            <th className="py-2 pl-2 text-right text-emerald-400">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 font-mono">
                          {groupStandings.map((st, idx) => (
                            <tr
                              key={st.teamId}
                              className={st.isQualified ? 'bg-emerald-500/5' : ''}
                            >
                              <td className="py-2.5 pr-2 font-sans font-bold text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 w-3">
                                    {idx + 1}
                                  </span>
                                  <span className="truncate max-w-[140px] sm:max-w-none">
                                    {st.teamName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-1.5 text-center text-slate-300">
                                {st.played}
                              </td>
                              <td className="py-2.5 px-1.5 text-center text-emerald-400 font-bold">
                                {st.won}
                              </td>
                              <td className="py-2.5 px-1.5 text-center text-slate-400">
                                {st.lost}
                              </td>
                              <td className="py-2.5 px-1.5 text-center text-slate-300">
                                {st.pointDiff > 0 ? `+${st.pointDiff}` : st.pointDiff}
                              </td>
                              <td className="py-2.5 pl-2 text-right font-black text-emerald-400">
                                {st.points ?? st.won * 2}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: READ-ONLY KNOCKOUT BRACKET */}
        {activeTab === 'BRACKET' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span>Stage: Round of 16 &rarr; Finals</span>
              <span className="text-amber-400 font-bold">Single Elimination</span>
            </div>

            <div className="space-y-3">
              {['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].map((stageKey) => {
                const stageMatches = matches.filter((m) => m.stage === stageKey);
                if (stageMatches.length === 0) return null;

                const stageTitle =
                  stageKey === 'ROUND_OF_16'
                    ? 'Round of 16'
                    : stageKey === 'QUARTER_FINAL'
                    ? 'Quarter Finals'
                    : stageKey === 'SEMI_FINAL'
                    ? 'Semi Finals'
                    : 'Championship Final';

                return (
                  <div key={stageKey} className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {stageTitle}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {stageMatches.map((m) => {
                        const teamA = getTournamentTeam(m.teamAId, teams);
                        const teamB = getTournamentTeam(m.teamBId, teams);
                        const isCompleted = m.status === 'COMPLETED';

                        return (
                          <div
                            key={m.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>{m.matchCode}</span>
                              <span>{m.courtName || 'Court TBD'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`font-semibold truncate max-w-[160px] ${
                                  m.winnerTeamId && m.winnerTeamId === m.teamAId
                                    ? 'text-emerald-400 font-black'
                                    : 'text-slate-300'
                                }`}
                              >
                                {formatTeamName(teamA)}
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {isCompleted ? m.scoreA : '-'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`font-semibold truncate max-w-[160px] ${
                                  m.winnerTeamId && m.winnerTeamId === m.teamBId
                                    ? 'text-emerald-400 font-black'
                                    : 'text-slate-300'
                                }`}
                              >
                                {formatTeamName(teamB)}
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {isCompleted ? m.scoreB : '-'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-600 pt-8 pb-4">
        EquiPlay Live Tournament Engine • Read-Only Spectator Mode
      </footer>
    </div>
  );
};
