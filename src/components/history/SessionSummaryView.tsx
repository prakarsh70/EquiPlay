import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Zap,
  Flame,
  Share2,
  Download,
  CopyCheck,
  RotateCcw,
  Play,
  Calendar,
  Swords,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { Match } from '../../types/equiplay';
import { formatDuration } from '../../utils/time';
import { computeRankings } from '../../utils/ranking';
import { Button } from '../common/Button';
import { ConfirmModal } from '../modals/ConfirmModal';

export const SessionSummaryView: React.FC = () => {
  const { config, players, matches, resumeSession, resetSession, deleteMatch } = useMatchStore();
  const [copied, setCopied] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#38bdf8', '#f43f5e'],
      });
    } catch {
      // Ignore if canvas is unavailable
    }
  }, []);

  const completedMatches = useMemo(
    () => matches.filter((m) => m.status === 'COMPLETED'),
    [matches]
  );

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  // Compute full player statistics
  const stats = useMemo(() => {
    const list = players.map((player) => {
      let wins = 0;
      let losses = 0;
      let pointsScored = 0;
      let pointsConceded = 0;

      completedMatches.forEach((m) => {
        const isTeamA = m.teamA.includes(player.id);
        const isTeamB = m.teamB.includes(player.id);

        if (!isTeamA && !isTeamB) return;

        const scoreA = m.scoreA ?? 0;
        const scoreB = m.scoreB ?? 0;

        if (isTeamA) {
          pointsScored += scoreA;
          pointsConceded += scoreB;
          if (scoreA > scoreB) wins++;
          else if (scoreB > scoreA) losses++;
        } else if (isTeamB) {
          pointsScored += scoreB;
          pointsConceded += scoreA;
          if (scoreB > scoreA) wins++;
          else if (scoreA > scoreB) losses++;
        }
      });

      const totalPlayed = player.gamesPlayedToday;
      const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
      const diff = pointsScored - pointsConceded;

      return {
        player,
        totalPlayed,
        wins,
        losses,
        winRate,
        pointsScored,
        pointsConceded,
        diff,
      };
    });

    // Compute rankings with competition tie handling (e.g. T-1)
    return computeRankings(list);
  }, [players, completedMatches]);

  // Overall session metrics
  const sessionDuration = formatDuration(
    config.sessionStartTime ?? undefined,
    config.sessionEndTime ?? Date.now()
  );

  const totalPoints = completedMatches.reduce(
    (sum, m) => sum + (m.scoreA ?? 0) + (m.scoreB ?? 0),
    0
  );

  // Superlatives (supporting ties)
  const mvps = stats.filter((s) => s.rank === 1 && s.wins > 0);
  const maxPlayed = Math.max(0, ...stats.map((s) => s.totalPlayed));
  const workhorses = stats.filter((s) => s.totalPlayed === maxPlayed && s.totalPlayed > 0);
  const maxDiff = Math.max(0, ...stats.map((s) => s.diff));
  const topScorers = stats.filter((s) => s.diff === maxDiff && s.diff > 0);

  // Export JSON file
  const handleExportJSON = () => {
    const sessionExport = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      config,
      players,
      matches,
      stats: stats.map((s) => ({
        id: s.player.id,
        name: s.player.name,
        rank: s.displayRank,
        isTied: s.isTied,
        gamesPlayed: s.totalPlayed,
        wins: s.wins,
        losses: s.losses,
        winRate: s.winRate,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointDifferential: s.diff,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessionExport, null, 2));
    const downloadAnchor = document.createElement('a');
    const filenameDate = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `equiplay-session-${filenameDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Share text summary (WhatsApp / Chat)
  const handleShareSummary = async () => {
    let summaryText = `🏸 *EquiPlay Session Summary*\n`;
    summaryText += `📅 Date: ${new Date().toLocaleDateString()}\n`;
    summaryText += `⏱ Duration: ${sessionDuration} | Target: ${config.pointFormat} pts\n`;
    summaryText += `🏟 Courts: ${config.courtNames.join(', ')} | Matches: ${completedMatches.length}\n\n`;

    if (mvps.length > 0) {
      const mvpNames = mvps.map((m) => m.player.name).join(' & ');
      const label = mvps.length > 1 ? 'Co-MVPs (Tied)' : 'MVP';
      summaryText += `🥇 *${label}*: ${mvpNames} (${mvps[0].wins}W / ${mvps[0].totalPlayed}G, ${mvps[0].winRate}%)\n`;
    }
    if (workhorses.length > 0) {
      const workhorseNames = workhorses.map((w) => w.player.name).join(' & ');
      summaryText += `⚡ *Workhorse*: ${workhorseNames} (${workhorses[0].totalPlayed} Matches)\n`;
    }
    if (topScorers.length > 0) {
      const topScorerNames = topScorers.map((t) => t.player.name).join(' & ');
      summaryText += `🎯 *Best Diff*: ${topScorerNames} (+${topScorers[0].diff} pts)\n`;
    }

    summaryText += `\n📊 *LEADERBOARD*:\n`;
    stats.forEach((s) => {
      const diffSign = s.diff >= 0 ? `+${s.diff}` : `${s.diff}`;
      summaryText += `${s.displayRank}. ${s.player.name} - ${s.wins}W / ${s.losses}L (${s.winRate}%) [Diff: ${diffSign}]\n`;
    });

    summaryText += `\n🎾 *MATCH RESULTS*:\n`;
    completedMatches.forEach((m, idx) => {
      const a1 = playerMap.get(m.teamA[0])?.name || 'P1';
      const a2 = playerMap.get(m.teamA[1])?.name || 'P2';
      const b1 = playerMap.get(m.teamB[0])?.name || 'P3';
      const b2 = playerMap.get(m.teamB[1])?.name || 'P4';
      summaryText += `#${idx + 1} [${m.courtName}] ${a1} & ${a2} (${m.scoreA}) vs (${m.scoreB}) ${b1} & ${b2}\n`;
    });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'EquiPlay Session Summary',
          text: summaryText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="text-center space-y-3 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" /> Session Concluded
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Session <span className="text-emerald-400">Wrap-Up</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          All matches finalized and saved locally. Review player performance, share the report, or export session data for cloud backup.
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Matches</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {completedMatches.length}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Duration</span>
            <span className="text-2xl font-black text-amber-300 font-mono">
              {sessionDuration}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Points</span>
            <span className="text-2xl font-black text-sky-400 font-mono">
              {totalPoints}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Active Players</span>
            <span className="text-2xl font-black text-slate-200 font-mono">
              {players.filter((p) => p.gamesPlayedToday > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Superlatives & Honors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {mvps.length > 0 && (
          <div className="bg-slate-900 border border-amber-400/40 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg shadow-amber-950/10">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                {mvps.length > 1 ? 'Co-MVPs (Tied)' : 'Session MVP'}
              </span>
              <p className="text-base font-black text-slate-100 truncate">
                {mvps.map((m) => m.player.name).join(' & ')}
              </p>
              <p className="text-xs text-slate-400">
                {mvps[0].wins} Wins ({mvps[0].winRate}%)
              </p>
            </div>
          </div>
        )}

        {workhorses.length > 0 && (
          <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg shadow-emerald-950/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                The Workhorse {workhorses.length > 1 ? '(Tied)' : ''}
              </span>
              <p className="text-base font-black text-slate-100 truncate">
                {workhorses.map((w) => w.player.name).join(' & ')}
              </p>
              <p className="text-xs text-slate-400">{workhorses[0].totalPlayed} Matches Played</p>
            </div>
          </div>
        )}

        {topScorers.length > 0 && (
          <div className="bg-slate-900 border border-sky-500/40 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg shadow-sky-950/10">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                Point Differential {topScorers.length > 1 ? '(Tied)' : ''}
              </span>
              <p className="text-base font-black text-slate-100 truncate">
                {topScorers.map((t) => t.player.name).join(' & ')}
              </p>
              <p className="text-xs text-slate-400">
                +{topScorers[0].diff} Differential
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-slate-100">Full Player Statistics</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {stats.length} Registered Players
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3 text-center">Played</th>
                <th className="py-2.5 px-3 text-center">W - L</th>
                <th className="py-2.5 px-3 text-center">Win %</th>
                <th className="py-2.5 px-3 text-center">Pts For</th>
                <th className="py-2.5 px-3 text-center">Pts Agst</th>
                <th className="py-2.5 px-3 text-center">+/- Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {stats.map((s) => {
                const isPositiveDiff = s.diff > 0;
                const isNegativeDiff = s.diff < 0;

                return (
                  <tr key={s.player.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      {s.rank === 1 && s.wins > 0 ? (
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                          <Award className="w-4 h-4 inline shrink-0" />
                          <span>{s.displayRank}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">{s.displayRank}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">
                      {s.player.name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {s.totalPlayed}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">{s.wins}</span> -{' '}
                      <span className="text-rose-400">{s.losses}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                      {s.winRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                      {s.pointsScored}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                      {s.pointsConceded}
                    </td>
                    <td
                      className={`py-3 px-3 text-center font-mono text-xs font-bold ${
                        isPositiveDiff
                          ? 'text-emerald-400'
                          : isNegativeDiff
                            ? 'text-rose-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {isPositiveDiff ? `+${s.diff}` : s.diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Results Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          Completed Matches ({completedMatches.length})
        </h2>

        {completedMatches.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No matches were recorded during this session.
          </div>
        ) : (
          <div className="space-y-2.5">
            {completedMatches.map((match, idx) => {
              const pA1 = playerMap.get(match.teamA[0])?.name || 'Player 1';
              const pA2 = playerMap.get(match.teamA[1])?.name || 'Player 2';
              const pB1 = playerMap.get(match.teamB[0])?.name || 'Player 3';
              const pB2 = playerMap.get(match.teamB[1])?.name || 'Player 4';

              const scoreA = match.scoreA ?? 0;
              const scoreB = match.scoreB ?? 0;
              const teamAWon = scoreA > scoreB;

              return (
                <div
                  key={match.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {match.courtName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      [{formatDuration(match.startTime, match.endTime)}]
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 flex-1 sm:max-w-md">
                    <div
                      className={`text-right ${
                        teamAWon ? 'text-emerald-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <span className="text-xs block">
                        {pA1} & {pA2}
                      </span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono font-bold text-xs flex items-center gap-1.5 shrink-0">
                      <span className={teamAWon ? 'text-emerald-400' : 'text-slate-300'}>
                        {scoreA}
                      </span>
                      <Swords className="w-3 h-3 text-slate-600" />
                      <span className={!teamAWon ? 'text-sky-400' : 'text-slate-300'}>
                        {scoreB}
                      </span>
                    </div>

                    <div
                      className={`text-left ${
                        !teamAWon ? 'text-sky-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <span className="text-xs block">
                        {pB1} & {pB2}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMatchToDelete(match)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer shrink-0"
                      title="Delete match"
                      aria-label={`Delete match ${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share, Export, and Action Controls */}
      <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Save, Share & Progress Export
        </h3>
        <p className="text-xs text-slate-400">
          Share today&apos;s results with the group chat or download the full session JSON backup for analytics in next phases.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Share Button */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleShareSummary}
          >
            {copied ? (
              <>
                <CopyCheck className="w-5 h-5 mr-2 text-slate-950" />
                Copied Summary to Clipboard!
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 mr-2" />
                Share to WhatsApp / Chat
              </>
            )}
          </Button>

          {/* Export JSON Button */}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleExportJSON}
          >
            <Download className="w-5 h-5 mr-2 text-emerald-400" />
            Export Session Data (JSON)
          </Button>
        </div>

        {/* Resume or Start New Session */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={resumeSession}
          >
            <Play className="w-4 h-4 mr-2" /> Resume This Session
          </Button>

          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={() => setIsResetConfirmOpen(true)}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Start New Session
          </Button>
        </div>
      </div>

      {/* Confirm Start New Session */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Start New Session?"
        message="This session's summary has already been saved to your session records. Starting a new session will reset all games played and courts for your next outing."
        confirmLabel="Start New Session"
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          resetSession();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Confirm Delete Match */}
      {matchToDelete && (
        <ConfirmModal
          isOpen={Boolean(matchToDelete)}
          title="Delete Match Record?"
          message="Are you sure you want to delete this completed match? Player stats, points, and win/loss records will be updated automatically."
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
