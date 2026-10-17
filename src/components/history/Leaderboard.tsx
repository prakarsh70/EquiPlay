import React from 'react';
import { Trophy, Award } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { computeRankings, PlayerStatEntry } from '../../utils/ranking';

interface LeaderboardProps {
  players: SessionPlayer[];
  completedMatches: Match[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, completedMatches }) => {
  // Calculate wins, points, and differential per player
  const playerStats: PlayerStatEntry[] = players.map((player) => {
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
      wins,
      losses,
      totalPlayed,
      winRate,
      pointsScored,
      pointsConceded,
      diff,
    };
  });

  // Compute standard competition rankings with tie handling
  const rankedPlayers = computeRankings(playerStats);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        <div>
          <h3 className="text-base font-bold text-slate-100">Session Leaderboard</h3>
          <p className="text-xs text-slate-400">Wins & participation summary for today</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Player</th>
              <th className="py-2.5 px-3 text-center">Played</th>
              <th className="py-2.5 px-3 text-center">Wins</th>
              <th className="py-2.5 px-3 text-center">Win %</th>
              <th className="py-2.5 px-3 text-center">+/- Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {rankedPlayers.map((item) => {
              const isPositiveDiff = item.diff > 0;
              const isNegativeDiff = item.diff < 0;

              return (
                <tr
                  key={item.player.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    {item.rank === 1 && item.wins > 0 ? (
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                        <Award className="w-4 h-4 inline shrink-0" />
                        <span>{item.displayRank}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono">{item.displayRank}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-200">
                    {item.player.name}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {item.totalPlayed}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                    {item.wins}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                    {item.winRate}%
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
                    {isPositiveDiff ? `+${item.diff}` : item.diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
