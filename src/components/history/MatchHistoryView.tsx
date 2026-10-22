import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  CopyCheck,
  CalendarDays,
  Activity,
  Coffee,
  Sparkles,
  Clock,
  Trash2,
} from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { Match } from '../../types/equiplay';
import { Leaderboard } from './Leaderboard';
import { formatDuration } from '../../utils/time';
import { computeRankings } from '../../utils/ranking';
import { generateProjectedSchedule } from '../../utils/matchmaker';
import { Button } from '../common/Button';
import { ElapsedTimer } from '../common/ElapsedTimer';
import { ConfirmModal } from '../modals/ConfirmModal';

interface MatchHistoryViewProps {
  showBackButton?: boolean;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  showBackButton = true,
}) => {
  const { matches, players, setView, config, deleteMatch } = useMatchStore();
  const [copied, setCopied] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  // Player lookup
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

  // Calculate projected upcoming matches (ChatGPT style)
  const projectedSchedule = useMemo(() => {
    const startIndex = completedMatches.length + inProgressMatches.length + 1;
    const historyEntries = [...completedMatches, ...inProgressMatches].map((m) => ({
      courtName: m.courtName,
      teamA: m.teamA,
      teamB: m.teamB,
    }));
    return generateProjectedSchedule(
      players,
      config.courtNames,
      upcomingMatches.map((m) => ({
        courtName: m.courtName,
        teamA: m.teamA,
        teamB: m.teamB,
      })),
      startIndex,
      Math.max(6, upcomingMatches.length + 4),
      historyEntries
    );
  }, [players, config.courtNames, upcomingMatches, completedMatches, inProgressMatches]);

  const handleCopySummary = () => {
    let summaryText = `🏸 EquiPlay Session Schedule & Summary\n`;
    summaryText += `Date: ${new Date().toLocaleDateString()}\n`;
    summaryText += `Format: ${config.pointFormat} pts | Total Completed: ${completedMatches.length}\n\n`;

    // 1. Leaderboard
    const playerStatsList = players.map((player) => {
      let wins = 0;
      let losses = 0;
      let pointsScored = 0;
      let pointsConceded = 0;

      completedMatches.forEach((m) => {
        const isTeamA = m.teamA.includes(player.id);
        const isTeamB = m.teamB.includes(player.id);
        if (!isTeamA && !isTeamB) return;
        const sA = m.scoreA ?? 0;
        const sB = m.scoreB ?? 0;
        if (isTeamA) {
          pointsScored += sA;
          pointsConceded += sB;
          if (sA > sB) wins++;
          else if (sB > sA) losses++;
        } else if (isTeamB) {
          pointsScored += sB;
          pointsConceded += sA;
          if (sB > sA) wins++;
          else if (sA > sB) losses++;
        }
      });

      const totalPlayed = player.gamesPlayedToday;
      const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
      const diff = pointsScored - pointsConceded;

      return { player, wins, losses, totalPlayed, winRate, pointsScored, pointsConceded, diff };
    });

    const ranked = computeRankings(playerStatsList);

    summaryText += `📊 LEADERBOARD:\n`;
    ranked.forEach((s) => {
      const diffSign = s.diff >= 0 ? `+${s.diff}` : `${s.diff}`;
      summaryText += `${s.displayRank}. ${s.player.name} - ${s.wins}W / ${s.losses}L (${s.winRate}%) [Diff: ${diffSign}]\n`;
    });

    // 2. Completed Match Log
    if (completedMatches.length > 0) {
      summaryText += `\n🏆 PLAYED MATCH RESULTS:\n`;
      completedMatches.forEach((m, idx) => {
        const a1 = playerMap.get(m.teamA[0]) || 'P1';
        const a2 = playerMap.get(m.teamA[1]) || 'P2';
        const b1 = playerMap.get(m.teamB[0]) || 'P3';
        const b2 = playerMap.get(m.teamB[1]) || 'P4';
        const duration = formatDuration(m.startTime, m.endTime);
        summaryText += `${idx + 1}. [${m.courtName}] ${a1} & ${a2} (${m.scoreA}) vs (${m.scoreB}) ${b1} & ${b2} [${duration}]\n`;
      });
    }

    // 3. Live On Court
    if (inProgressMatches.length > 0) {
      summaryText += `\n⚡ ON COURT NOW:\n`;
      inProgressMatches.forEach((m) => {
        const a1 = playerMap.get(m.teamA[0]) || 'P1';
        const a2 = playerMap.get(m.teamA[1]) || 'P2';
        const b1 = playerMap.get(m.teamB[0]) || 'P3';
        const b2 = playerMap.get(m.teamB[1]) || 'P4';
        summaryText += `• [${m.courtName}] ${a1} & ${a2} vs ${b1} & ${b2} (Live)\n`;
      });
    }

    // 4. Projected Upcoming Fixtures
    if (projectedSchedule.length > 0) {
      summaryText += `\n⏳ UPCOMING SCHEDULE TABLE:\n`;
      projectedSchedule.forEach((m) => {
        const a1 = playerMap.get(m.teamA[0]) || 'P1';
        const a2 = playerMap.get(m.teamA[1]) || 'P2';
        const b1 = playerMap.get(m.teamB[0]) || 'P3';
        const b2 = playerMap.get(m.teamB[1]) || 'P4';
        const restingNames = m.restingPlayerIds
          .map((id) => playerMap.get(id))
          .filter(Boolean)
          .join(', ');
        summaryText += `Match ${m.matchNumber} [${m.courtName}]: ${a1} & ${a2} vs ${b1} & ${b2} | Resting: ${restingNames || 'None'}\n`;
      });
    }

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                type="button"
                onClick={() => setView('DASHBOARD')}
                aria-label="Back to dashboard"
                className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-emerald-400" />
              <span>Session Schedule &amp; Match Log</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Single chronological tracker: past results, active courts, and projected upcoming rounds.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopySummary}
          className="text-xs font-bold shadow-sm whitespace-nowrap min-h-[44px]"
        >
          {copied ? (
            <>
              <CopyCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-emerald-400 mr-1.5" />
              Copy Schedule &amp; Results
            </>
          )}
        </Button>
      </div>

      {/* Part 1: Completed Matches Log Table */}
      <section className="space-y-3" aria-labelledby="completed-log-heading">
        <div className="flex items-center justify-between">
          <h2
            id="completed-log-heading"
            className="text-base font-bold text-slate-100 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1. Played Matches Log ({completedMatches.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {completedMatches.length} Finished
          </span>
        </div>

        {completedMatches.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-xs">
            No matches completed yet. Completed games will appear here with scores and durations.
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
                  <th className="py-3 px-3 text-center w-16">Action</th>
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete match record"
                          aria-label={`Delete match ${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4 inline" />
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

      {/* Part 2: Live On Court Now (if active) */}
      {inProgressMatches.length > 0 && (
        <section className="space-y-3" aria-labelledby="live-on-court-heading">
          <div className="flex items-center justify-between">
            <h2
              id="live-on-court-heading"
              className="text-base font-bold text-slate-100 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>2. Currently On Court (Live)</span>
            </h2>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {inProgressMatches.length} Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inProgressMatches.map((m) => {
              const a1 = playerMap.get(m.teamA[0]) || 'Player 1';
              const a2 = playerMap.get(m.teamA[1]) || 'Player 2';
              const b1 = playerMap.get(m.teamB[0]) || 'Player 3';
              const b2 = playerMap.get(m.teamB[1]) || 'Player 4';

              return (
                <div
                  key={m.id}
                  className="bg-slate-900 border-2 border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-sm text-slate-100">{m.courtName}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      <span className="text-emerald-400">{a1} &amp; {a2}</span>
                      <span className="text-slate-500 mx-1.5 uppercase font-bold text-[10px]">vs</span>
                      <span className="text-sky-400">{b1} &amp; {b2}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Elapsed
                    </span>
                    <ElapsedTimer startTime={m.startTime} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Part 3: Projected Upcoming Matches (ChatGPT Style Table) */}
      <section className="space-y-3" aria-labelledby="projected-schedule-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h2
              id="projected-schedule-heading"
              className="text-base font-bold text-slate-100"
            >
              3. Projected Upcoming Matches (Next Rounds)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Dynamic fair rotation
          </span>
        </div>

        {projectedSchedule.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-xs">
            Not enough active players to project upcoming matches. Add at least 4 active players.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3.5 text-center w-16">Match #</th>
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
                  <th className="py-3 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {projectedSchedule.map((m) => {
                  const a1 = playerMap.get(m.teamA[0]) || 'Player 1';
                  const a2 = playerMap.get(m.teamA[1]) || 'Player 2';
                  const b1 = playerMap.get(m.teamB[0]) || 'Player 3';
                  const b2 = playerMap.get(m.teamB[1]) || 'Player 4';

                  const restingNames = m.restingPlayerIds
                    .map((id) => playerMap.get(id))
                    .filter(Boolean);

                  return (
                    <tr
                      key={`proj-${m.matchNumber}-${m.courtName}`}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        m.isQueued ? 'bg-amber-400/5' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-300">
                        #{m.matchNumber}
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
                        {m.isQueued ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            <Clock className="w-2.5 h-2.5" />
                            Up Next
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Projected
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

      {/* Part 4: Live Leaderboard / Standings */}
      <section className="space-y-3 pt-4 border-t border-slate-800/80">
        <Leaderboard players={players} completedMatches={completedMatches} />
      </section>

      {/* Delete Match Confirmation Modal */}
      {matchToDelete && (
        <ConfirmModal
          isOpen={Boolean(matchToDelete)}
          title="Delete Match Record?"
          message="Are you sure you want to delete this match record? It will be permanently removed from the session log and player statistics will be automatically recalculated."
          confirmLabel="Delete Match"
          onConfirm={() => {
            deleteMatch(matchToDelete.id);
            setMatchToDelete(null);
          }}
          onCancel={() => setMatchToDelete(null)}
        />
      )}
    </div>
  );
};
