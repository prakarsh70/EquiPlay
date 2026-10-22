import { describe, it, expect } from 'vitest';
import {
  generateNextMatches,
  reshufflePairing,
  generateProjectedSchedule,
  planSessionSchedule,
} from './matchmaker';
import { SessionPlayer } from '../types/equiplay';

describe('Core Matchmaking Algorithm (generateNextMatches)', () => {
  const createPlayer = (
    id: string,
    gamesPlayedToday: number,
    consecutiveGamesSatOut: number,
    isActive = true
  ): SessionPlayer => ({
    id,
    name: `Player ${id}`,
    isActive,
    gamesPlayedToday,
    consecutiveGamesSatOut,
    arrivalTime: Date.now(),
  });

  it('should return empty array if less than 4 active players are available', () => {
    const players: SessionPlayer[] = [
      createPlayer('1', 0, 0, true),
      createPlayer('2', 0, 0, true),
      createPlayer('3', 0, 0, true),
    ];
    expect(generateNextMatches(players, 1)).toEqual([]);
  });

  it('should exclude busyPlayerIds from being picked', () => {
    const players: SessionPlayer[] = [
      createPlayer('1', 0, 0, true),
      createPlayer('2', 0, 0, true),
      createPlayer('3', 0, 0, true),
      createPlayer('4', 0, 0, true),
      createPlayer('5', 0, 0, true),
    ];
    // Player 1 is busy
    const matches = generateNextMatches(players, 1, ['1']);
    expect(matches).toHaveLength(1);
    const allPicked = [...matches[0].teamA, ...matches[0].teamB];
    expect(allPicked).not.toContain('1');
    expect(allPicked).toEqual(expect.arrayContaining(['2', '3', '4', '5']));
  });

  it('should prioritize players with fewest games played, then longest bench wait', () => {
    const players: SessionPlayer[] = [
      createPlayer('p_many_games', 3, 2, true),
      createPlayer('p_few_games_low_wait', 1, 0, true),
      createPlayer('p_few_games_high_wait', 1, 2, true),
      createPlayer('p_zero_games_a', 0, 0, true),
      createPlayer('p_zero_games_b', 0, 1, true),
    ];

    const matches = generateNextMatches(players, 1);
    expect(matches).toHaveLength(1);

    const picked = [...matches[0].teamA, ...matches[0].teamB];
    // p_many_games (3 games) should be left on the bench
    expect(picked).not.toContain('p_many_games');
    // Top 4 selected should be:
    // 0 games: p_zero_games_b (wait 1), p_zero_games_a (wait 0)
    // 1 game: p_few_games_high_wait (wait 2), p_few_games_low_wait (wait 0)
    expect(picked).toContain('p_zero_games_b');
    expect(picked).toContain('p_zero_games_a');
    expect(picked).toContain('p_few_games_high_wait');
    expect(picked).toContain('p_few_games_low_wait');
  });

  it('should snake-draft pair the 4 selected players: 0 & 3 vs 1 & 2', () => {
    const players: SessionPlayer[] = [
      createPlayer('0', 0, 3, true),
      createPlayer('1', 0, 2, true),
      createPlayer('2', 0, 1, true),
      createPlayer('3', 0, 0, true),
    ];

    const matches = generateNextMatches(players, 1);
    expect(matches).toEqual([
      {
        teamA: ['0', '3'],
        teamB: ['1', '2'],
      },
    ]);
  });

  it('should create pairings for multiple courts when players are available', () => {
    const players: SessionPlayer[] = Array.from({ length: 8 }, (_, i) =>
      createPlayer(String(i), 0, 0, true)
    );

    const matches = generateNextMatches(players, 2);
    expect(matches).toHaveLength(2);
    const court1Players = [...matches[0].teamA, ...matches[0].teamB];
    const court2Players = [...matches[1].teamA, ...matches[1].teamB];

    // No duplicate players between courts
    const intersection = court1Players.filter((id) => court2Players.includes(id));
    expect(intersection).toHaveLength(0);
  });

  it('should pair linked teammates together on the same team', () => {
    const p1 = createPlayer('1', 0, 0, true);
    const p2 = createPlayer('2', 0, 0, true);
    const p3 = createPlayer('3', 0, 0, true);
    const p4 = createPlayer('4', 0, 0, true);

    // Link p1 and p2 as doubles partners
    p1.partnerId = '2';
    p2.partnerId = '1';

    const matches = generateNextMatches([p1, p2, p3, p4], 1);
    expect(matches).toHaveLength(1);

    const match = matches[0];
    const teamA = match.teamA;
    const teamB = match.teamB;

    const areP1P2Together =
      (teamA.includes('1') && teamA.includes('2')) ||
      (teamB.includes('1') && teamB.includes('2'));

    expect(areP1P2Together).toBe(true);
  });

  it('should shuffle teams and courts for 8 players across 2 courts in consecutive rounds', () => {
    const players: SessionPlayer[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((id) =>
      createPlayer(id, 0, 0, true)
    );
    const targetCourts = ['Court 1', 'Court 2'];

    // Round 1
    const round1 = generateNextMatches(players, 2, [], [], targetCourts);
    expect(round1).toHaveLength(2);

    const r1Court1Match = round1[0];
    const r1Court2Match = round1[1];

    const r1Court1Players = [...r1Court1Match.teamA, ...r1Court1Match.teamB];
    const r1Court2Players = [...r1Court2Match.teamA, ...r1Court2Match.teamB];

    // Simulate Round 1 completion: all 8 players now have 1 game played
    const playersAfterR1 = players.map((p) => ({
      ...p,
      gamesPlayedToday: 1,
      consecutiveGamesSatOut: 0,
    }));

    const round1History = [
      { courtName: 'Court 1', teamA: r1Court1Match.teamA, teamB: r1Court1Match.teamB },
      { courtName: 'Court 2', teamA: r1Court2Match.teamA, teamB: r1Court2Match.teamB },
    ];

    // Generate Round 2 with Round 1 history
    const round2 = generateNextMatches(playersAfterR1, 2, [], round1History, targetCourts);
    expect(round2).toHaveLength(2);

    const r2Court1Match = round2[0];
    const r2Court2Match = round2[1];

    const r2Court1Players = [...r2Court1Match.teamA, ...r2Court1Match.teamB];
    const r2Court2Players = [...r2Court2Match.teamA, ...r2Court2Match.teamB];

    // 1. Shuffled between Courts: Neither Court 1 nor Court 2 should have the exact same 4 players as Round 1!
    const r1C1Set = new Set(r1Court1Players);
    const r2C1Set = new Set(r2Court1Players);
    const isIdenticalCourt1 = [...r2C1Set].every((id) => r1C1Set.has(id));
    expect(isIdenticalCourt1).toBe(false);

    const r1C2Set = new Set(r1Court2Players);
    const r2C2Set = new Set(r2Court2Players);
    const isIdenticalCourt2 = [...r2C2Set].every((id) => r1C2Set.has(id));
    expect(isIdenticalCourt2).toBe(false);

    // 2. Shuffled between Teams: partners in Round 2 must NOT repeat Round 1 partners
    const r1PartnerPairs = [
      new Set(r1Court1Match.teamA),
      new Set(r1Court1Match.teamB),
      new Set(r1Court2Match.teamA),
      new Set(r1Court2Match.teamB),
    ];

    const isR1PartnerPair = (p1: string, p2: string) =>
      r1PartnerPairs.some((pair) => pair.has(p1) && pair.has(p2));

    expect(isR1PartnerPair(r2Court1Match.teamA[0], r2Court1Match.teamA[1])).toBe(false);
    expect(isR1PartnerPair(r2Court1Match.teamB[0], r2Court1Match.teamB[1])).toBe(false);
    expect(isR1PartnerPair(r2Court2Match.teamA[0], r2Court2Match.teamA[1])).toBe(false);
    expect(isR1PartnerPair(r2Court2Match.teamB[0], r2Court2Match.teamB[1])).toBe(false);
  });

  it('should shuffle doubles teams on 1 court for 4 players across consecutive rounds', () => {
    const players: SessionPlayer[] = ['A', 'B', 'C', 'D'].map((id) =>
      createPlayer(id, 0, 0, true)
    );

    // Round 1: [A, D] vs [B, C]
    const r1 = generateNextMatches(players, 1, [], [], ['Court 1']);
    expect(r1).toHaveLength(1);

    const r1History = [{ courtName: 'Court 1', teamA: r1[0].teamA, teamB: r1[0].teamB }];
    const playersAfterR1 = players.map((p) => ({ ...p, gamesPlayedToday: 1 }));

    // Round 2
    const r2 = generateNextMatches(playersAfterR1, 1, [], r1History, ['Court 1']);
    expect(r2).toHaveLength(1);

    // Team pairings in Round 2 must NOT be the same as Round 1!
    const r1TeamASet = new Set(r1[0].teamA);
    const r2TeamASet = new Set(r2[0].teamA);
    const sameTeamA = [...r1TeamASet].every((id) => r2TeamASet.has(id));
    expect(sameTeamA).toBe(false);
  });
});

describe('Reshuffle Pairing Utility', () => {
  it('should cycle through alternate balanced pairings for 4 players', () => {
    const fourIds: [string, string, string, string] = ['p0', 'p1', 'p2', 'p3'];

    // Combo 0 -> Combo 1
    const shuffle1 = reshufflePairing(fourIds, ['p0', 'p3']);
    expect(shuffle1).toEqual({
      teamA: ['p0', 'p2'],
      teamB: ['p1', 'p3'],
    });

    // Combo 1 -> Combo 2
    const shuffle2 = reshufflePairing(fourIds, ['p0', 'p2']);
    expect(shuffle2).toEqual({
      teamA: ['p0', 'p1'],
      teamB: ['p2', 'p3'],
    });

    // Combo 2 -> Combo 0
    const shuffle3 = reshufflePairing(fourIds, ['p0', 'p1']);
    expect(shuffle3).toEqual({
      teamA: ['p0', 'p3'],
      teamB: ['p1', 'p2'],
    });
  });
});

describe('Projected Schedule Generator (generateProjectedSchedule)', () => {
  const createPlayer = (id: string, name: string): SessionPlayer => ({
    id,
    name,
    isActive: true,
    gamesPlayedToday: 0,
    consecutiveGamesSatOut: 0,
    arrivalTime: Date.now(),
  });

  it('should return empty if less than 4 players', () => {
    const players = [createPlayer('1', 'P1'), createPlayer('2', 'P2')];
    expect(generateProjectedSchedule(players, ['Court 1'], [])).toEqual([]);
  });

  it('should project multiple sequential matches and identify resting players', () => {
    const players = [
      createPlayer('1', 'P1'),
      createPlayer('2', 'P2'),
      createPlayer('3', 'P3'),
      createPlayer('4', 'P4'),
      createPlayer('5', 'P5'),
      createPlayer('6', 'P6'),
    ];

    const projected = generateProjectedSchedule(
      players,
      ['Court 1'],
      [],
      1,
      4
    );

    expect(projected).toHaveLength(4);
    expect(projected[0].matchNumber).toBe(1);
    expect(projected[0].restingPlayerIds).toHaveLength(2); // 6 players - 4 on court = 2 resting
    expect(projected[1].matchNumber).toBe(2);

    // Verify all players get turns across 4 projected matches
    const allPlayed = new Set<string>();
    projected.forEach((m) => {
      [...m.teamA, ...m.teamB].forEach((id) => allPlayed.add(id));
    });
    expect(allPlayed.size).toBe(6);
  });
});

describe('Session Sequence Planner (planSessionSchedule - Issue #3)', () => {
  const createPlayer = (id: string, name: string): SessionPlayer => ({
    id,
    name,
    isActive: true,
    gamesPlayedToday: 0,
    consecutiveGamesSatOut: 0,
    arrivalTime: Date.now(),
  });

  it('10-player 1-court test case: deliberately considers combinations and partners D with I or J', () => {
    // 10 players A through J
    const playerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const players = playerLetters.map((letter) => createPlayer(letter, `Player ${letter}`));

    // Plan full 2-hour session (8 matches of 15 mins each)
    const result = planSessionSchedule(players, {
      totalMatches: 8,
      sessionDurationMinutes: 120,
      matchDurationMinutes: 15,
      courtNames: ['Court 1'],
    });

    expect(result.validation.isFeasible).toBe(true);
    expect(result.schedule).toHaveLength(8);

    // 1. Time slots should be accurately stamped
    expect(result.schedule[0].timeSlot).toBe('0–15 min');
    expect(result.schedule[1].timeSlot).toBe('15–30 min');
    expect(result.schedule[7].timeSlot).toBe('105–120 min');

    // 2. Resting players should always be exactly 6 (10 - 4 = 6)
    result.schedule.forEach((m) => {
      expect(m.restingPlayerIds).toHaveLength(6);
    });

    // 3. Zero consecutive back-to-back matches (since 10 >= 8)
    expect(result.validation.metrics.backToBackCount).toBe(0);

    // 4. Equalized games: every player should play either 3 or 4 games (32 slots / 10 = 3.2)
    expect(result.validation.metrics.minGamesPerPlayer).toBeGreaterThanOrEqual(3);
    expect(result.validation.metrics.maxGamesPerPlayer).toBeLessThanOrEqual(4);

    // 5. CRITICAL FIX FOR ISSUE #3:
    // Verify that Player D partners with I or J in at least one match across the sequence!
    const dPartners: string[] = [];
    result.schedule.forEach((m) => {
      if (m.teamA.includes('D')) {
        const partner = m.teamA[0] === 'D' ? m.teamA[1] : m.teamA[0];
        dPartners.push(partner);
      } else if (m.teamB.includes('D')) {
        const partner = m.teamB[0] === 'D' ? m.teamB[1] : m.teamB[0];
        dPartners.push(partner);
      }
    });

    const dPartneredWithIorJ = dPartners.includes('I') || dPartners.includes('J');
    expect(dPartneredWithIorJ).toBe(true);

    // 6. High variety score
    expect(result.validation.metrics.varietyScorePercent).toBeGreaterThanOrEqual(75);
  });

  it('detects and reports mathematical impossibilities for rules', () => {
    // 6 players on 1 court
    const sixPlayers = ['A', 'B', 'C', 'D', 'E', 'F'].map((l) => createPlayer(l, l));
    const resultSix = planSessionSchedule(sixPlayers, {
      totalMatches: 4,
      courtNames: ['Court 1'],
    });

    // Impossible to avoid back-to-back with 6 players (needs 8)
    const hasBackToBackWarning = resultSix.validation.warnings.some((w) =>
      w.includes('Zero back-to-back matches is mathematically impossible')
    );
    expect(hasBackToBackWarning).toBe(true);

    // Non-divisible total slots reports equal games impossibility
    const hasEqualGamesWarning = resultSix.validation.warnings.some((w) =>
      w.includes('Exact equal games is mathematically impossible')
    );
    expect(hasEqualGamesWarning).toBe(true);
  });

  it('reports isFeasible: false when less than 4 players are provided', () => {
    const twoPlayers = ['A', 'B'].map((l) => createPlayer(l, l));
    const result = planSessionSchedule(twoPlayers);
    expect(result.validation.isFeasible).toBe(false);
    expect(result.schedule).toHaveLength(0);
    expect(result.validation.warnings[0]).toContain('At least 4 active players');
  });
});

