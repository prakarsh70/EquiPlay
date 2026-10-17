import { describe, it, expect } from 'vitest';
import { computeRankings, PlayerStatEntry } from './ranking';

describe('Ranking and Tie-breaking Engine', () => {
  it('correctly ties two players with identical records', () => {
    const rawStats: PlayerStatEntry[] = [
      {
        player: { id: 'p1', name: 'Akash' },
        wins: 3,
        losses: 0,
        totalPlayed: 3,
        winRate: 100,
        pointsScored: 33,
        pointsConceded: 19,
        diff: 14,
      },
      {
        player: { id: 'p2', name: 'Swayam' },
        wins: 3,
        losses: 0,
        totalPlayed: 3,
        winRate: 100,
        pointsScored: 33,
        pointsConceded: 19,
        diff: 14,
      },
      {
        player: { id: 'p3', name: 'Shubham' },
        wins: 0,
        losses: 3,
        totalPlayed: 3,
        winRate: 0,
        pointsScored: 19,
        pointsConceded: 33,
        diff: -14,
      },
    ];

    const ranked = computeRankings(rawStats);

    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].displayRank).toBe('T-1');
    expect(ranked[0].isTied).toBe(true);

    expect(ranked[1].rank).toBe(1);
    expect(ranked[1].displayRank).toBe('T-1');
    expect(ranked[1].isTied).toBe(true);

    // Player 3 should be rank 3 (1224 competition ranking)
    expect(ranked[2].rank).toBe(3);
    expect(ranked[2].displayRank).toBe('3');
    expect(ranked[2].isTied).toBe(false);
  });

  it('correctly ranks players when there are no ties', () => {
    const rawStats: PlayerStatEntry[] = [
      {
        player: { id: 'p1', name: 'First' },
        wins: 3,
        losses: 0,
        totalPlayed: 3,
        winRate: 100,
        pointsScored: 33,
        pointsConceded: 15,
        diff: 18,
      },
      {
        player: { id: 'p2', name: 'Second' },
        wins: 2,
        losses: 1,
        totalPlayed: 3,
        winRate: 67,
        pointsScored: 30,
        pointsConceded: 20,
        diff: 10,
      },
    ];

    const ranked = computeRankings(rawStats);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].displayRank).toBe('1');
    expect(ranked[0].isTied).toBe(false);

    expect(ranked[1].rank).toBe(2);
    expect(ranked[1].displayRank).toBe('2');
    expect(ranked[1].isTied).toBe(false);
  });
});
