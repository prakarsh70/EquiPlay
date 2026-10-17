import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Share2, CopyCheck, Swords } from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { Leaderboard } from './Leaderboard';
import { formatDuration } from '../../utils/time';
import { computeRankings } from '../../utils/ranking';
import { Button } from '../common/Button';

export const MatchHistoryView: React.FC = () => {
  const { matches, players, setView, config } = useMatchStore();
  const [copied, setCopied] = useState(false);

  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

  // Player lookup
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  const handleCopySummary = () => {
    let summaryText = `🏸 EquiPlay Session Summary\n`;
    summaryText += `Date: ${new Date().toLocaleDateString()}\n`;
    summaryText += `Format: ${config.pointFormat} pts | Total Matches: ${completedMatches.length}\n\n`;

    // Compute rankings with tie handling
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

    summaryText += `\n🏆 MATCH RESULTS:\n`;
    completedMatches.forEach((m, idx) => {
      const a1 = playerMap.get(m.teamA[0]) || 'P1';
      const a2 = playerMap.get(m.teamA[1]) || 'P2';
      const b1 = playerMap.get(m.teamB[0]) || 'P3';
      const b2 = playerMap.get(m.teamB[1]) || 'P4';
      const duration = formatDuration(m.startTime, m.endTime);
      summaryText += `${idx + 1}. [${m.courtName}] ${a1} & ${a2} (${m.scoreA}) vs (${m.scoreB}) ${b1} & ${b2} [${duration}]\n`;
    });

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setView('DASHBOARD')}
          aria-label="Back to dashboard"
          className="min-h-[48px] px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold inline-flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {completedMatches.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopySummary}
            className="text-xs"
          >
            {copied ? (
              <>
                <CopyCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-emerald-400 mr-1.5" />
                Copy Session Summary
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
          Session Log & Analytics
        </h1>
        <p className="text-xs text-slate-400">
          All completed matches and participation metrics for today
        </p>
      </div>

      {/* Leaderboard */}
      <Leaderboard players={players} completedMatches={completedMatches} />

      {/* Completed Matches List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Completed Matches ({completedMatches.length})
        </h2>

        {completedMatches.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm">
            No matches completed yet. Finish a match on court to view it here.
          </div>
        ) : (
          <div className="space-y-3">
            {[...completedMatches].reverse().map((match, idx) => {
              const pA1 = playerMap.get(match.teamA[0]) || 'Player 1';
              const pA2 = playerMap.get(match.teamA[1]) || 'Player 2';
              const pB1 = playerMap.get(match.teamB[0]) || 'Player 3';
              const pB2 = playerMap.get(match.teamB[1]) || 'Player 4';

              const scoreA = match.scoreA ?? 0;
              const scoreB = match.scoreB ?? 0;
              const teamAWon = scoreA > scoreB;

              return (
                <div
                  key={match.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">
                      #{completedMatches.length - idx}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">
                        {match.courtName}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Duration: {formatDuration(match.startTime, match.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Teams and Scores */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 flex-1 sm:max-w-md">
                    {/* Team A */}
                    <div
                      className={`text-right ${
                        teamAWon ? 'text-emerald-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <p className="text-xs truncate">{pA1}</p>
                      <p className="text-xs truncate">{pA2}</p>
                    </div>

                    {/* Final Score */}
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-black text-sm tracking-wider flex items-center gap-2">
                      <span className={teamAWon ? 'text-emerald-400' : 'text-slate-300'}>
                        {scoreA}
                      </span>
                      <Swords className="w-3.5 h-3.5 text-slate-600" />
                      <span className={!teamAWon ? 'text-sky-400' : 'text-slate-300'}>
                        {scoreB}
                      </span>
                    </div>

                    {/* Team B */}
                    <div
                      className={`text-left ${
                        !teamAWon ? 'text-sky-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <p className="text-xs truncate">{pB1}</p>
                      <p className="text-xs truncate">{pB2}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

