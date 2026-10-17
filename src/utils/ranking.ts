export interface PlayerStatEntry {
  player: { id: string; name: string };
  totalPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  diff: number;
}

export interface RankedPlayerStat extends PlayerStatEntry {
  rank: number;
  isTied: boolean;
  displayRank: string;
}

export function arePlayerStatsEqual(
  a: {
    wins: number;
    totalPlayed: number;
    diff: number;
    pointsScored: number;
    pointsConceded: number;
  },
  b: {
    wins: number;
    totalPlayed: number;
    diff: number;
    pointsScored: number;
    pointsConceded: number;
  }
): boolean {
  return (
    a.wins === b.wins &&
    a.totalPlayed === b.totalPlayed &&
    a.diff === b.diff &&
    a.pointsScored === b.pointsScored &&
    a.pointsConceded === b.pointsConceded
  );
}

/**
 * Computes standard sports competition ranking (1224) with tie detection.
 * If two players have identical records, they share the same rank (e.g. T-1).
 */
export function computeRankings<T extends PlayerStatEntry>(
  items: T[]
): (T & { rank: number; isTied: boolean; displayRank: string })[] {
  if (items.length === 0) return [];

  // 1. Sort by Wins DESC, Diff DESC, Win Rate DESC, Points Scored DESC, then stable name
  const sorted = [...items].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointsScored !== a.pointsScored) return b.pointsScored - a.pointsScored;
    return a.player.name.localeCompare(b.player.name);
  });

  // 2. Identify tied groups
  const tiedCountMap = new Map<number, number>();
  let currentRank = 1;
  const tempRanked: (T & { rank: number; isTied: boolean; displayRank: string })[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && arePlayerStatsEqual(sorted[i], sorted[i - 1])) {
      const rank = tempRanked[i - 1].rank;
      tempRanked.push({
        ...sorted[i],
        rank,
        isTied: true,
        displayRank: `${rank}`,
      });
      tiedCountMap.set(rank, (tiedCountMap.get(rank) || 1) + 1);
    } else {
      currentRank = i + 1;
      tempRanked.push({
        ...sorted[i],
        rank: currentRank,
        isTied: false,
        displayRank: `${currentRank}`,
      });
      tiedCountMap.set(currentRank, 1);
    }
  }

  // 3. Set displayRank with T- prefix for tied positions
  return tempRanked.map((item) => {
    const isTied = (tiedCountMap.get(item.rank) || 0) > 1;
    return {
      ...item,
      isTied,
      displayRank: isTied ? `T-${item.rank}` : `${item.rank}`,
    };
  });
}
