import { describe, it, expect } from 'vitest';
import { generateNextMatches, reshufflePairing, generateProjectedSchedule } from './matchmaker';
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

