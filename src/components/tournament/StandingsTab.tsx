import React, { useState } from 'react';
import { HelpCircle, BarChart3, Trophy, Layers } from 'lucide-react';
import { GroupId } from '../../types/tournament';
import { useTournamentStore } from '../../store/useTournamentStore';
import {
  computeAllStandings,
  computeRoundRobinStandings,
} from '../../utils/tournamentEngine';
import { TOURNAMENT_GROUPS } from '../../data/tournamentSeed';

export const StandingsTab: React.FC = () => {
  const { teams, matches, config, settings, setActiveTab } = useTournamentStore();
  const [selectedGroup, setSelectedGroup] = useState<GroupId | 'ALL'>('ALL');

  if (config.format === 'KNOCKOUT') {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <Layers className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-black text-slate-100">
          Pure Knockout Tournament
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Single elimination tournaments do not use points tables. Check the Knockout Bracket tab to track live progression.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('BRACKET')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
        >
          <Trophy className="w-4 h-4" />
          <span>View Knockout Bracket</span>
        </button>
      </div>
    );
  }

  // Pure Round Robin Table
  if (config.format === 'ROUND_ROBIN') {
    const rrStandings = computeRoundRobinStandings(teams, matches);
    const completedMatchesCount = matches.filter((m) => m.status === 'COMPLETED').length;

    return (
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 bg-slate-850 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">
                  Round Robin League Table
                </h3>
                <p className="text-xs text-slate-400">
                  {completedMatchesCount}/{matches.length} Matches Completed • {teams.length} Teams
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              #1 Ranked is Champion
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 uppercase font-black tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-2 text-center" title="Played">P</th>
                  <th className="py-3 px-2 text-center text-emerald-400" title="Won">W</th>
                  <th className="py-3 px-2 text-center text-rose-400" title="Lost">L</th>
                  <th className="py-3 px-2 text-center" title="Points For">PF</th>
                  <th className="py-3 px-2 text-center" title="Points Against">PA</th>
                  <th className="py-3 px-3 text-center font-mono font-bold" title="Point Differential">PD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {rrStandings.map((standing, index) => {
                  const rank = index + 1;
                  const isLeader = index === 0 && standing.played > 0;

                  return (
                    <tr
                      key={standing.teamId}
                      className={`transition-colors ${
                        isLeader
                          ? 'bg-amber-400/[0.06] hover:bg-amber-400/[0.1]'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black font-mono ${
                            isLeader
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            #{standing.teamNumber}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-100">
                            {standing.teamName}
                          </span>
                          {isLeader && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-400 border border-amber-400/30">
                              Leader
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-2 text-center font-mono text-slate-300">
                        {standing.played}
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono font-bold text-emerald-400">
                        {standing.won}
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono text-rose-400">
                        {standing.lost}
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono text-slate-400">
                        {standing.pointsFor}
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono text-slate-400">
                        {standing.pointsAgainst}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-black">
                        <span
                          className={
                            standing.pointDiff > 0
                              ? 'text-emerald-400'
                              : standing.pointDiff < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {standing.pointDiff > 0
                            ? `+${standing.pointDiff}`
                            : standing.pointDiff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tie Breaker Rules Banner */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Official Tie-Breaker Priority Rules</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
            <li><strong className="text-slate-300">Total Wins:</strong> Teams with higher total wins rank higher.</li>
            <li><strong className="text-slate-300">Head-to-Head Result:</strong> If exactly two teams are tied on wins, the winner of their direct match ranks higher.</li>
            <li><strong className="text-slate-300">Point Differential:</strong> Total Points Scored minus Points Conceded (PF - PA).</li>
            <li><strong className="text-slate-300">Total Points For (PF):</strong> Total points scored.</li>
          </ol>
        </div>
      </div>
    );
  }

  // GROUP_KNOCKOUT: 8 Pools
  const allStandings = computeAllStandings(teams, matches, settings);
  const activeGroups = TOURNAMENT_GROUPS.filter((g) =>
    teams.some((t) => t.group === g)
  );
  const groupsToDisplay =
    selectedGroup === 'ALL'
      ? activeGroups.length > 0
        ? activeGroups
        : TOURNAMENT_GROUPS
      : [selectedGroup];

  return (
    <div className="space-y-6">
      {/* Group Quick Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Pools:
        </span>
        <button
          type="button"
          onClick={() => setSelectedGroup('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            selectedGroup === 'ALL'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          All Pools
        </button>
        {groupsToDisplay.map((grp) => (
          <button
            key={grp}
            type="button"
            onClick={() => setSelectedGroup(grp)}
            className={`min-w-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              selectedGroup === grp
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            Pool {grp}
          </button>
        ))}
      </div>

      {/* Standings Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupsToDisplay.map((grp) => {
          const groupStandings = allStandings[grp] || [];
          const groupMatches = matches.filter((m) => m.group === grp);
          const completedMatchesInGroup = groupMatches.filter(
            (m) => m.status === 'COMPLETED'
          ).length;

          return (
            <div
              key={grp}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg shadow-slate-950/40"
            >
              {/* Group Card Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-sm text-emerald-400 font-mono">
                    {grp}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 tracking-tight">
                      Pool {grp} Table
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {completedMatchesInGroup}/{groupMatches.length} Matches Played
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Top 2 Advance</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 uppercase font-black tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Team</th>
                      <th className="py-2.5 px-2 text-center" title="Played">P</th>
                      <th className="py-2.5 px-2 text-center text-emerald-400" title="Won">W</th>
                      <th className="py-2.5 px-2 text-center text-rose-400" title="Lost">L</th>
                      <th className="py-2.5 px-2 text-center" title="Points For">PF</th>
                      <th className="py-2.5 px-2 text-center" title="Points Against">PA</th>
                      <th className="py-2.5 px-2.5 text-center font-mono font-bold" title="Point Differential">PD</th>
                      <th className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-400" title="Tournament Points">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {groupStandings.map((standing, index) => {
                      const rank = index + 1;
                      const isTop2 = standing.isQualified;

                      return (
                        <tr
                          key={standing.teamId}
                          className={`transition-colors ${
                            isTop2
                              ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black font-mono ${
                                isTop2
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {rank}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold text-slate-500">
                                #{standing.teamNumber}
                              </span>
                              <div className="truncate">
                                <span
                                  className={`text-xs font-bold block truncate ${
                                    isTop2 ? 'text-slate-100' : 'text-slate-300'
                                  }`}
                                >
                                  {standing.teamName}
                                </span>
                              </div>
                              {isTop2 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                  Q
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center font-mono text-slate-300">
                            {standing.played}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400">
                            {standing.won}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-rose-400">
                            {standing.lost}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-400">
                            {standing.pointsFor}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-400">
                            {standing.pointsAgainst}
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono font-black">
                            <span
                              className={
                                standing.pointDiff > 0
                                  ? 'text-emerald-400'
                                  : standing.pointDiff < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }
                            >
                              {standing.pointDiff > 0
                                ? `+${standing.pointDiff}`
                                : standing.pointDiff}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono font-black text-emerald-400 text-sm">
                            {standing.points ?? standing.won * 2}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tie Breaker Rules Explainer Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Official Tie-Breaker Priority Rules</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
          <li><strong className="text-slate-300">Total Wins:</strong> Teams with higher total wins rank higher.</li>
          <li><strong className="text-slate-300">Head-to-Head Result:</strong> If exactly two teams are tied on wins, the winner of the direct match between them ranks higher.</li>
          <li><strong className="text-slate-300">Point Differential:</strong> Total Points Scored minus Points Conceded (PF - PA).</li>
          <li><strong className="text-slate-300">Total Points For (PF):</strong> Total points scored across all group matches.</li>
        </ol>
      </div>
    </div>
  );
};
