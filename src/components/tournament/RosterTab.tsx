import React, { useState } from 'react';
import {
  Edit3,
  Tag,
  Search,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Users,
  Lock,
} from 'lucide-react';
import { TournamentTeam, GroupId } from '../../types/tournament';
import { useTournamentStore } from '../../store/useTournamentStore';
import { TOURNAMENT_GROUPS } from '../../data/tournamentSeed';

interface RosterTabProps {
  onOpenEditModal: (team: TournamentTeam) => void;
  onOpenAddModal: () => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  onOpenEditModal,
  onOpenAddModal,
}) => {
  const {
    teams,
    matches,
    config,
    removeTeam,
    loadSampleRoster,
    clearAllTeams,
    generateFixtures,
  } = useTournamentStore();

  const hasStarted = matches.some((m) => m.status !== 'UPCOMING');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupId | 'ALL'>('ALL');

  const filteredTeams = teams.filter((team) => {
    if (selectedGroup !== 'ALL' && team.group !== selectedGroup) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const p1 = team.player1.toLowerCase();
      const p2 = team.player2?.toLowerCase() || '';
      const alias = (team.alias || '').toLowerCase();
      const num = team.teamNumber.toString();
      if (
        !p1.includes(q) &&
        !p2.includes(q) &&
        !alias.includes(q) &&
        !num.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Tournament Roster ({teams.length} Teams)</span>
            {hasStarted && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Roster Locked</span>
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400">
            {hasStarted
              ? 'Matches are underway. You can still swap names for absent players, but roster size and fixtures are locked.'
              : 'Manage registered teams, swap absent players, or update pool seeds.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            disabled={hasStarted}
            title={hasStarted ? 'Cannot add teams once matches have started' : 'Add new team'}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              hasStarted
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Team</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (hasStarted) return;
              if (
                window.confirm(
                  'Regenerate all tournament fixtures for the current roster?'
                )
              ) {
                generateFixtures();
              }
            }}
            disabled={hasStarted}
            title={hasStarted ? 'Cannot regenerate fixtures once matches have started' : 'Regen Fixtures'}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
              hasStarted
                ? 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 cursor-pointer active:scale-95'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Regen Fixtures</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (hasStarted) return;
              loadSampleRoster();
            }}
            disabled={hasStarted}
            title={hasStarted ? 'Cannot replace roster once matches have started' : 'Load Sample 32'}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
              hasStarted
                ? 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 cursor-pointer active:scale-95'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample 32</span>
          </button>

          {teams.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (hasStarted) return;
                if (window.confirm('Clear all teams from the roster?')) {
                  clearAllTeams();
                }
              }}
              disabled={hasStarted}
              title={hasStarted ? 'Cannot clear roster once matches have started' : 'Clear all teams'}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                hasStarted
                  ? 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
                  : 'bg-slate-800 hover:bg-rose-500/20 text-rose-400 border-slate-700 cursor-pointer active:scale-95'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Pool Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Pool Selector Pills (Visible if format has pools) */}
        {config.format === 'GROUP_KNOCKOUT' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedGroup === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              All Pools
            </button>
            {TOURNAMENT_GROUPS.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`min-w-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedGroup === grp
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-bold pl-2">
            Format: {config.format === 'ROUND_ROBIN' ? 'Pure Round Robin League' : 'Single Elimination Knockout'}
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search player, team #, alias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Roster Cards Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">
            No teams found.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Your First Team</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-black font-mono text-xs text-slate-200">
                    #{team.teamNumber}
                  </span>
                  {team.group && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      Pool {team.group}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-100 tracking-tight">
                    {team.player1}
                    {team.player2 ? ` & ${team.player2}` : ''}
                  </h4>
                  {team.alias && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400 font-semibold">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span>{team.alias}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenEditModal(team)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (hasStarted) return;
                    if (
                      window.confirm(
                        `Remove Team #${team.teamNumber} (${team.player1}) from the roster?`
                      )
                    ) {
                      removeTeam(team.id);
                    }
                  }}
                  disabled={hasStarted}
                  aria-label="Delete team"
                  title={
                    hasStarted
                      ? 'Teams cannot be deleted once matches have started'
                      : 'Delete team'
                  }
                  className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-colors ${
                    hasStarted
                      ? 'bg-slate-850 text-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
