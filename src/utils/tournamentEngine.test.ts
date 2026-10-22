import { describe, it, expect } from 'vitest';
import {
  generateAllGroupMatches,
  generateGroupMatches,
  generateInitialKnockoutMatches,
  computeGroupStandings,
  syncKnockoutTree,
} from './tournamentEngine';
import { SEEDED_TOURNAMENT_TEAMS } from '../data/tournamentSeed';
import { TournamentMatch, TournamentTeam } from '../types/tournament';

describe('tournamentEngine', () => {
  describe('generateGroupMatches', () => {
    it('generates exactly 6 matches for a 4-team group in the exact specified order', () => {
      const groupA = SEEDED_TOURNAMENT_TEAMS.filter((t) => t.group === 'A');
      const matches = generateGroupMatches('A', groupA);

      expect(matches).toHaveLength(6);
      expect(matches[0].matchCode).toBe('G-A-1');
      expect(matches[0].teamAId).toBe('team-6'); // T1
      expect(matches[0].teamBId).toBe('team-27'); // T4

      expect(matches[1].matchCode).toBe('G-A-2');
      expect(matches[1].teamAId).toBe('team-11'); // T2
      expect(matches[1].teamBId).toBe('team-14'); // T3

      expect(matches[2].matchCode).toBe('G-A-3');
      expect(matches[2].teamAId).toBe('team-6'); // T1
      expect(matches[2].teamBId).toBe('team-14'); // T3

      expect(matches[3].matchCode).toBe('G-A-4');
      expect(matches[3].teamAId).toBe('team-27'); // T4
      expect(matches[3].teamBId).toBe('team-11'); // T2

      expect(matches[4].matchCode).toBe('G-A-5');
      expect(matches[4].teamAId).toBe('team-6'); // T1
      expect(matches[4].teamBId).toBe('team-11'); // T2

      expect(matches[5].matchCode).toBe('G-A-6');
      expect(matches[5].teamAId).toBe('team-14'); // T3
      expect(matches[5].teamBId).toBe('team-27'); // T4
    });

    it('generates all 48 group matches across 8 groups', () => {
      const matches = generateAllGroupMatches(SEEDED_TOURNAMENT_TEAMS);
      expect(matches).toHaveLength(48);
      const groupCodes = matches.map((m) => m.matchCode);
      expect(groupCodes).toContain('G-A-1');
      expect(groupCodes).toContain('G-H-6');
    });
  });

  describe('generateInitialKnockoutMatches', () => {
    it('generates 8 R16, 4 QF, 2 SF, 1 Final match (15 matches)', () => {
      const matches = generateInitialKnockoutMatches();
      expect(matches).toHaveLength(15);
      expect(matches.filter((m) => m.stage === 'ROUND_OF_16')).toHaveLength(8);
      expect(matches.filter((m) => m.stage === 'QUARTER_FINAL')).toHaveLength(4);
      expect(matches.filter((m) => m.stage === 'SEMI_FINAL')).toHaveLength(2);
      expect(matches.filter((m) => m.stage === 'FINAL')).toHaveLength(1);
    });
  });

  describe('computeGroupStandings and Tie-Breakers', () => {
    const mockTeams: TournamentTeam[] = [
      { id: 't1', teamNumber: 1, player1: 'P1', player2: 'P2', group: 'A' },
      { id: 't2', teamNumber: 2, player1: 'P3', player2: 'P4', group: 'A' },
      { id: 't3', teamNumber: 3, player1: 'P5', player2: 'P6', group: 'A' },
      { id: 't4', teamNumber: 4, player1: 'P7', player2: 'P8', group: 'A' },
    ];

    it('ranks primarily by Total Wins', () => {
      const matches: TournamentMatch[] = [
        {
          id: 'm1',
          matchCode: 'G-A-1',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't1',
          teamBId: 't4',
          status: 'COMPLETED',
          scoreA: 21,
          scoreB: 15,
          winnerTeamId: 't1',
        },
      ];

      const standings = computeGroupStandings('A', mockTeams, matches);
      expect(standings[0].teamId).toBe('t1');
      expect(standings[0].won).toBe(1);
      expect(standings[0].lost).toBe(0);
      expect(standings[0].pointDiff).toBe(6);
      expect(standings[0].isQualified).toBe(true);
      expect(standings[1].isQualified).toBe(true);
      expect(standings[2].isQualified).toBe(false);
      expect(standings[3].isQualified).toBe(false);
    });

    it('breaks 2-team tie on wins using Head-to-Head result', () => {
      // t3 has 2 wins, t4 has 0 wins.
      // Exactly 2 teams (t1 and t2) are tied on 1 win each.
      // t2 has a higher point differential (+15), but t1 beat t2 head-to-head!
      const matches: TournamentMatch[] = [
        // t3 beats t4
        {
          id: 'm1',
          matchCode: 'G-A-6',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't3',
          teamBId: 't4',
          status: 'COMPLETED',
          scoreA: 21,
          scoreB: 10,
          winnerTeamId: 't3',
        },
        // t3 beats t1
        {
          id: 'm2',
          matchCode: 'G-A-3',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't1',
          teamBId: 't3',
          status: 'COMPLETED',
          scoreA: 15,
          scoreB: 21,
          winnerTeamId: 't3',
        },
        // t1 beats t2 directly
        {
          id: 'm3',
          matchCode: 'G-A-5',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't1',
          teamBId: 't2',
          status: 'COMPLETED',
          scoreA: 21,
          scoreB: 19,
          winnerTeamId: 't1',
        },
        // t2 beats t4 with a huge margin (high point differential)
        {
          id: 'm4',
          matchCode: 'G-A-4',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't4',
          teamBId: 't2',
          status: 'COMPLETED',
          scoreA: 5,
          scoreB: 21,
          winnerTeamId: 't2',
        },
      ];

      // t3: 2 wins
      // t1: 1 win, pointDiff = -4 (15-21 + 21-19)
      // t2: 1 win, pointDiff = +14 (19-21 + 21-5)
      // t4: 0 wins
      // Head-to-head between t1 and t2: t1 won (21-19).
      // Therefore, t1 MUST rank higher than t2 despite t2 having much higher pointDiff!
      const standings = computeGroupStandings('A', mockTeams, matches);
      const t1Rank = standings.findIndex((s) => s.teamId === 't1');
      const t2Rank = standings.findIndex((s) => s.teamId === 't2');
      expect(standings[0].teamId).toBe('t3');
      expect(t1Rank).toBe(1);
      expect(t2Rank).toBe(2);
      expect(t1Rank).toBeLessThan(t2Rank);
    });

    it('breaks ties using Point Differential when head-to-head is not conclusive or 3-way tied', () => {
      // 3 teams with 1 win each (cycle: t1 > t2 > t3 > t1)
      const matches: TournamentMatch[] = [
        {
          id: 'm1',
          matchCode: 'G-A-1',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't1',
          teamBId: 't2',
          status: 'COMPLETED',
          scoreA: 21,
          scoreB: 10, // t1 +11, t2 -11
          winnerTeamId: 't1',
        },
        {
          id: 'm2',
          matchCode: 'G-A-2',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't2',
          teamBId: 't3',
          status: 'COMPLETED',
          scoreA: 21,
          scoreB: 15, // t2 +6, t3 -6
          winnerTeamId: 't2',
        },
        {
          id: 'm3',
          matchCode: 'G-A-3',
          stage: 'GROUP',
          group: 'A',
          teamAId: 't3',
          teamBId: 't1',
          status: 'COMPLETED',
          scoreA: 21,
          scoreB: 19, // t3 +2, t1 -2
          winnerTeamId: 't3',
        },
      ];

      const standings = computeGroupStandings('A', mockTeams, matches);
      // All 3 have 1 win.
      // t1: +9
      // t2: -5
      // t3: -4
      // So t1 (+9) should be first, t3 (-4) second, t2 (-5) third!
      expect(standings[0].teamId).toBe('t1');
      expect(standings[1].teamId).toBe('t3');
      expect(standings[2].teamId).toBe('t2');
    });
  });

  describe('syncKnockoutTree', () => {
    it('correctly maps 1st and 2nd of each group to R16 matches', () => {
      const groupMatches = generateAllGroupMatches(SEEDED_TOURNAMENT_TEAMS);
      const initialKnockouts = generateInitialKnockoutMatches();
      const allMatches = [...groupMatches, ...initialKnockouts];

      const synced = syncKnockoutTree(allMatches, SEEDED_TOURNAMENT_TEAMS);
      const r16_1 = synced.find((m) => m.matchCode === 'R16-1');
      const r16_5 = synced.find((m) => m.matchCode === 'R16-5');

      expect(r16_1).toBeDefined();
      expect(r16_5).toBeDefined();

      // Top 2 of Group A initially (by teamNumber fallback): team-6, team-11
      // Top 2 of Group B initially (by teamNumber fallback): team-7, team-12
      // R16-1: 1st Group A vs 2nd Group B
      expect(r16_1?.teamAId).toBe('team-6');
      expect(r16_1?.teamBId).toBe('team-12');

      // R16-5: 1st Group B vs 2nd Group A
      expect(r16_5?.teamAId).toBe('team-7');
      expect(r16_5?.teamBId).toBe('team-11');
    });

    it('advances winners from R16 to QF, SF, and Final', () => {
      const groupMatches = generateAllGroupMatches(SEEDED_TOURNAMENT_TEAMS);
      const initialKnockouts = generateInitialKnockoutMatches();
      let allMatches = [...groupMatches, ...initialKnockouts];
      allMatches = syncKnockoutTree(allMatches, SEEDED_TOURNAMENT_TEAMS);

      // Complete R16-1 and R16-2
      const r16_1 = allMatches.find((m) => m.matchCode === 'R16-1')!;
      const r16_2 = allMatches.find((m) => m.matchCode === 'R16-2')!;

      r16_1.status = 'COMPLETED';
      r16_1.scoreA = 21;
      r16_1.scoreB = 18;
      r16_1.winnerTeamId = r16_1.teamAId;

      r16_2.status = 'COMPLETED';
      r16_2.scoreA = 15;
      r16_2.scoreB = 21;
      r16_2.winnerTeamId = r16_2.teamBId;

      const synced = syncKnockoutTree(allMatches, SEEDED_TOURNAMENT_TEAMS);
      const qf1 = synced.find((m) => m.matchCode === 'QF-1')!;

      expect(qf1.teamAId).toBe(r16_1.teamAId);
      expect(qf1.teamBId).toBe(r16_2.teamBId);
    });
  });
});
