import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  CheckCircle2,
  Trophy,
  Edit2,
  Search,
  Filter,
} from 'lucide-react';
import {
  GroupId,
  TournamentMatch,
  TournamentStage,
} from '../../types/tournament';
import { useTournamentStore } from '../../store/useTournamentStore';
import {
  formatTeamName,
  getKnockoutSlotPlaceholder,
  getTournamentTeam,
} from '../../utils/tournamentEngine';
import { Badge } from '../common/Badge';

interface FixturesTabProps {
  onOpenScoreModal: (match: TournamentMatch) => void;
}

const STAGES: Array<{ key: TournamentStage | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Stages' },
  { key: 'GROUP', label: 'Pools (Group Stage)' },
  { key: 'ROUND_OF_16', label: 'Round of 16' },
  { key: 'QUARTER_FINAL', label: 'Quarter Finals' },
  { key: 'SEMI_FINAL', label: 'Semi Finals' },
  { key: 'FINAL', label: 'Finals' },
];

const GROUPS: Array<GroupId | 'ALL'> = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const FixturesTab: React.FC<FixturesTabProps> = ({ onOpenScoreModal }) => {
  const {
    matches,
    teams,
    courts,
    selectedStageFilter,
    selectedGroupFilter,
    selectedCourtFilter,
    setSelectedStageFilter,
    setSelectedGroupFilter,
    assignMatchCourt,
    autoAssignCourts,
    startMatch,
  } = useTournamentStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-backfill default courts based on availability if any loaded matches are unassigned
  useEffect(() => {
    if (matches.length > 0 && matches.some((m) => !m.courtName)) {
      autoAssignCourts();
    }
  }, [matches, autoAssignCourts]);

  // Real-time court availability computation
  const inProgressCourts = useMemo(() => {
    return new Set(
      matches
        .filter((m) => m.status === 'IN_PROGRESS' && m.courtName)
        .map((m) => m.courtName!)
    );
  }, [matches]);

  const availableCourts = useMemo(() => {
    return courts.filter((c) => !inProgressCourts.has(c));
  }, [courts, inProgressCourts]);

  // Filtering matches
  const filteredMatches = matches.filter((match) => {
    // Stage filter
    if (selectedStageFilter !== 'ALL' && match.stage !== selectedStageFilter) {
      return false;
    }
    // Group filter (only relevant for GROUP stage)
    if (match.stage === 'GROUP') {
      if (selectedGroupFilter !== 'ALL' && match.group !== selectedGroupFilter) {
        return false;
      }
    } else if (selectedGroupFilter !== 'ALL') {
      // If a specific group is selected, don't show knockouts unless user selects ALL
      return false;
    }

    // Court filter
    if (selectedCourtFilter !== 'ALL') {
      if (match.courtName !== selectedCourtFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && match.status !== statusFilter) {
      return false;
    }

    // Search query by team / player name / matchCode
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const teamA = getTournamentTeam(match.teamAId, teams);
      const teamB = getTournamentTeam(match.teamBId, teams);
      const teamAName = formatTeamName(teamA).toLowerCase();
      const teamBName = formatTeamName(teamB).toLowerCase();
      const code = match.matchCode.toLowerCase();
      const court = (match.courtName || '').toLowerCase();

      if (
        !teamAName.includes(q) &&
        !teamBName.includes(q) &&
        !code.includes(q) &&
        !court.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedStageFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedStageFilter === s.key
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Group Filter Pills (Visible when Stage is GROUP or ALL) */}
        {(selectedStageFilter === 'ALL' || selectedStageFilter === 'GROUP') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Pool:
            </span>
            {GROUPS.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroupFilter(grp)}
                className={`min-w-[36px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  selectedGroupFilter === grp
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {grp === 'ALL' ? 'All Pools' : `Group ${grp}`}
              </button>
            ))}
          </div>
        )}

        {/* Court Availability Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-800/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Courts:
          </span>
          {courts.map((court) => {
            const isLive = inProgressCourts.has(court);
            return (
              <div
                key={court}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 shrink-0 transition-colors ${
                  isLive
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span>{court}</span>
                <span className="text-[10px] font-normal opacity-75">
                  {isLive ? 'Live' : 'Available'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'IN_PROGRESS', 'UPCOMING', 'COMPLETED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'IN_PROGRESS'
                  ? 'Live'
                  : st === 'UPCOMING'
                  ? 'Upcoming'
                  : 'Done'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search team, player, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
          <Filter className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">
            No matches match the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const teamA = getTournamentTeam(match.teamAId, teams);
            const teamB = getTournamentTeam(match.teamBId, teams);

            const displayTeamAName = teamA
              ? formatTeamName(teamA)
              : getKnockoutSlotPlaceholder(match.matchCode, 'A');
            const displayTeamBName = teamB
              ? formatTeamName(teamB)
              : getKnockoutSlotPlaceholder(match.matchCode, 'B');

            const isTeamAWinner =
              match.status === 'COMPLETED' && match.winnerTeamId === match.teamAId;
            const isTeamBWinner =
              match.status === 'COMPLETED' && match.winnerTeamId === match.teamBId;

            return (
              <div
                key={match.id}
                className={`flex flex-col justify-between p-4 rounded-2xl bg-slate-900 border transition-all ${
                  match.status === 'IN_PROGRESS'
                    ? 'border-amber-400/60 shadow-lg shadow-amber-950/20 ring-1 ring-amber-400/30'
                    : match.status === 'COMPLETED'
                    ? 'border-slate-800/90'
                    : 'border-slate-800'
                }`}
              >
                {/* Header: Match Code, Court, Status */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-slate-800 border border-slate-700 text-slate-200">
                      {match.matchCode}
                    </span>
                    {match.group && (
                      <span className="text-xs font-bold text-slate-400">
                        Group {match.group}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Court Selector Pill */}
                    <div className="relative">
                      <select
                        aria-label="Assign court for this match"
                        value={match.courtName || ''}
                        onChange={(e) => assignMatchCourt(match.id, e.target.value)}
                        className={`text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer border ${
                          match.courtName && inProgressCourts.has(match.courtName) && match.status !== 'IN_PROGRESS'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        {!match.courtName && <option value="">Auto-Assign Free Court</option>}
                        {courts.map((court) => {
                          const isBusy = inProgressCourts.has(court) && match.courtName !== court;
                          return (
                            <option key={court} value={court}>
                              {court} {isBusy ? '• In Play' : '• Available'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Status Badge */}
                    {match.status === 'IN_PROGRESS' && (
                      <Badge variant="amber" dot>
                        Live
                      </Badge>
                    )}
                    {match.status === 'COMPLETED' && (
                      <Badge variant="emerald">
                        Done
                      </Badge>
                    )}
                    {match.status === 'UPCOMING' && (
                      <Badge variant="slate">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Teams & Scores Comparison */}
                <div className="space-y-2 py-1">
                  {/* Team A */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isTeamAWinner
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-black font-mono text-slate-300 shrink-0">
                        {teamA ? teamA.teamNumber : 'A'}
                      </span>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-bold truncate block">
                          {displayTeamAName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isTeamAWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="text-lg font-black font-mono px-1.5">
                        {match.scoreA !== undefined ? match.scoreA : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Team B */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isTeamBWinner
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-black font-mono text-slate-300 shrink-0">
                        {teamB ? teamB.teamNumber : 'B'}
                      </span>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-bold truncate block">
                          {displayTeamBName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isTeamBWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="text-lg font-black font-mono px-1.5">
                        {match.scoreB !== undefined ? match.scoreB : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-800/60">
                  {match.status === 'UPCOMING' && (() => {
                    const isOccupied = match.courtName && inProgressCourts.has(match.courtName);
                    const targetCourt =
                      !isOccupied && match.courtName
                        ? match.courtName
                        : (availableCourts[0] || match.courtName || courts[0] || 'Court');

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => startMatch(match.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-700 hover:border-emerald-500/50"
                          title={`Start match on ${targetCourt}`}
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                          <span>Start on {targetCourt}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenScoreModal(match)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm shadow-emerald-950/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Log Score</span>
                        </button>
                      </>
                    );
                  })()}

                  {match.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      onClick={() => onOpenScoreModal(match)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-amber-950/30"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Complete &amp; Log Score</span>
                    </button>
                  )}

                  {match.status === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => onOpenScoreModal(match)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Score</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
