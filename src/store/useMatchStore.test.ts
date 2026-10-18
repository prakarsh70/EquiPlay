import { describe, it, expect, beforeEach } from 'vitest';
import { useMatchStore } from './useMatchStore';

describe('useMatchStore State & Transitions', () => {
  beforeEach(() => {
    // Reset store
    useMatchStore.getState().resetSession();
    // Clear players
    useMatchStore.setState({ players: [], matches: [], completedSessions: [] });
  });

  it('addPlayer creates player with gamesPlayedToday: 0 and consecutiveGamesSatOut: 0', () => {
    const store = useMatchStore.getState();
    store.addPlayer('Alice', true);

    const players = useMatchStore.getState().players;
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('Alice');
    expect(players[0].isActive).toBe(true);
    expect(players[0].gamesPlayedToday).toBe(0);
    expect(players[0].consecutiveGamesSatOut).toBe(0);
    expect(players[0].arrivalTime).toBeDefined();
  });

  it('addPlayer with isPresentNow: false sets arrivalTime to undefined', () => {
    const store = useMatchStore.getState();
    store.addPlayer('Bob', false);

    const player = useMatchStore.getState().players[0];
    expect(player.isActive).toBe(false);
    expect(player.arrivalTime).toBeUndefined();
  });

  it('togglePlayerActive flips isActive and stamps arrivalTime when transitioning from false to true', () => {
    const store = useMatchStore.getState();
    store.addPlayer('Charlie', false);

    const playerId = useMatchStore.getState().players[0].id;
    expect(useMatchStore.getState().players[0].arrivalTime).toBeUndefined();

    store.togglePlayerActive(playerId);

    const playerAfter = useMatchStore.getState().players[0];
    expect(playerAfter.isActive).toBe(true);
    expect(playerAfter.arrivalTime).toBeDefined();
  });

  it('walk-in player joining mid-match is prioritized in the next match', () => {
    const store = useMatchStore.getState();

    // 4 initial players
    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.setCourts(['Court 1']);
    store.startSession();

    // Start Match 1
    const match1 = useMatchStore.getState().matches.find((m) => m.status === 'UPCOMING')!;
    store.startMatch(match1.id);
    expect(useMatchStore.getState().matches[0].status).toBe('IN_PROGRESS');

    // 5th player walks in while match is in progress
    store.addPlayer('WalkIn_P5', true);
    const p5Id = useMatchStore.getState().players.find((p) => p.name === 'WalkIn_P5')!.id;

    // Match 1 finishes
    store.completeMatch(match1.id, 15, 13);

    // The match immediately queued for the court MUST contain WalkIn_P5
    const upcomingAfterFinish = useMatchStore.getState().matches.find((m) => m.status === 'UPCOMING');
    expect(upcomingAfterFinish).toBeDefined();

    const queuedPlayerIds = [
      ...upcomingAfterFinish!.teamA,
      ...upcomingAfterFinish!.teamB,
    ];
    expect(queuedPlayerIds).toContain(p5Id);
  });

  it('manual lineup edit allows coordinator to swap player and mark previous player as away', () => {
    const store = useMatchStore.getState();

    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.addPlayer('P5_Bench', true);
    store.setCourts(['Court 1']);
    store.startSession();

    const upcoming = useMatchStore.getState().matches.find((m) => m.status === 'UPCOMING')!;
    const p1Id = useMatchStore.getState().players.find((p) => p.name === 'P1')!.id;
    const p5Id = useMatchStore.getState().players.find((p) => p.name === 'P5_Bench')!.id;

    // P1 got an urgent call and has to leave, swap P1 with P5 and mark P1 away
    store.swapMatchPlayer(upcoming.id, p1Id, p5Id, true);

    const updatedMatch = useMatchStore.getState().matches.find((m) => m.id === upcoming.id)!;
    const allPicked = [...updatedMatch.teamA, ...updatedMatch.teamB];

    expect(allPicked).toContain(p5Id);
    expect(allPicked).not.toContain(p1Id);
    expect(updatedMatch.isManualLineup).toBe(true);

    // P1 should now be marked away
    const p1Player = useMatchStore.getState().players.find((p) => p.id === p1Id)!;
    expect(p1Player.isActive).toBe(false);
  });

  it('endSession transitions to SUMMARY view, stamps endTime, and saves to completedSessions', () => {
    const store = useMatchStore.getState();

    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.setCourts(['Court 1']);
    store.startSession();

    const match = useMatchStore.getState().matches[0];
    store.startMatch(match.id);
    store.completeMatch(match.id, 15, 10);

    // End session
    store.endSession();

    expect(useMatchStore.getState().currentView).toBe('SUMMARY');
    expect(useMatchStore.getState().config.sessionEndTime).not.toBeNull();
    expect(useMatchStore.getState().completedSessions).toHaveLength(1);

    const record = useMatchStore.getState().completedSessions[0];
    expect(record.matches.filter((m) => m.status === 'COMPLETED')).toHaveLength(1);
    expect(record.players).toHaveLength(4);
  });

  it('prioritizes assigning upcoming matches to empty courts over in-progress courts', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2']);

    // 7 players initially
    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.addPlayer('P5', true);
    store.addPlayer('P6', true);
    store.addPlayer('P7', true);

    store.startSession();

    // Start match on Court 1
    const match1 = useMatchStore.getState().matches.find((m) => m.courtName === 'Court 1')!;
    store.startMatch(match1.id);
    expect(useMatchStore.getState().matches.find((m) => m.id === match1.id)?.status).toBe('IN_PROGRESS');

    // 8th player walks in
    store.addPlayer('P8_WalkIn', true);

    // The newly created match MUST be assigned to Court 2 (which is open!), NOT Court 1
    const upcomingMatches = useMatchStore.getState().matches.filter((m) => m.status === 'UPCOMING');
    expect(upcomingMatches).toHaveLength(1);
    expect(upcomingMatches[0].courtName).toBe('Court 2');
  });

  it('auto-rebalances upcoming match from an in-progress court to an idle court', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2']);

    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.addPlayer('P5', true);
    store.addPlayer('P6', true);
    store.addPlayer('P7', true);
    store.addPlayer('P8', true);

    store.startSession();

    // Force an in-progress match on Court 1
    const court1Match = useMatchStore.getState().matches.find((m) => m.courtName === 'Court 1')!;
    store.startMatch(court1Match.id);

    // Manually simulate an upcoming match assigned to Court 1 while Court 2 is idle
    useMatchStore.setState((state) => ({
      matches: state.matches.map((m) =>
        m.status === 'UPCOMING' ? { ...m, courtName: 'Court 1', isManualLineup: false } : m
      ),
    }));

    // Trigger syncQueue
    store.syncQueue();

    // The auto-rebalance MUST move the match from Court 1 to Court 2
    const upcoming = useMatchStore.getState().matches.find((m) => m.status === 'UPCOMING')!;
    expect(upcoming.courtName).toBe('Court 2');
  });

  it('setPlayerPartner links teammates mutually and unlinks cleanly', () => {
    const store = useMatchStore.getState();
    store.addPlayer('Alice', true);
    store.addPlayer('Bob', true);

    const [alice, bob] = useMatchStore.getState().players;
    store.setPlayerPartner(alice.id, bob.id);

    const updatedPlayers = useMatchStore.getState().players;
    const updatedAlice = updatedPlayers.find((p) => p.id === alice.id)!;
    const updatedBob = updatedPlayers.find((p) => p.id === bob.id)!;

    expect(updatedAlice.partnerId).toBe(bob.id);
    expect(updatedBob.partnerId).toBe(alice.id);

    // Unlink
    store.setPlayerPartner(alice.id, null);
    const unlinkedPlayers = useMatchStore.getState().players;
    expect(unlinkedPlayers.find((p) => p.id === alice.id)?.partnerId).toBeUndefined();
    expect(unlinkedPlayers.find((p) => p.id === bob.id)?.partnerId).toBeUndefined();
  });

  it('createManualMatch puts players on court immediately with IN_PROGRESS status', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2']);
    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.startSession();

    const [p1, p2, p3, p4] = useMatchStore.getState().players;

    // Put them on Court 2 directly
    store.createManualMatch(
      'Court 2',
      [p1.id, p2.id],
      [p3.id, p4.id],
      true // startImmediately
    );

    const matchOnCourt2 = useMatchStore.getState().matches.find(
      (m) => m.courtName === 'Court 2' && m.status === 'IN_PROGRESS'
    );
    expect(matchOnCourt2).toBeDefined();
    expect(matchOnCourt2?.teamA).toEqual([p1.id, p2.id]);
    expect(matchOnCourt2?.teamB).toEqual([p3.id, p4.id]);
    expect(matchOnCourt2?.isManualLineup).toBe(true);
    expect(matchOnCourt2?.startTime).toBeDefined();
  });

  it('strictly limits concurrent upcoming matches to active player capacity (11 players, 4 courts -> max 2 matches)', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2', 'Court 3', 'Court 4']);

    // Add 12 players: 11 active, 1 away (user's exact scenario)
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    names.forEach((name) => {
      store.addPlayer(name, name !== 'e'); // 'e' is away
    });

    store.startSession();

    const matches = useMatchStore.getState().matches;
    const upcoming = matches.filter((m) => m.status === 'UPCOMING');

    // 11 active players -> can ONLY fill Math.floor(11 / 4) = 2 matches!
    expect(upcoming).toHaveLength(2);

    // Verify all players across both upcoming matches are unique
    const playerIds = upcoming.flatMap((m) => [...m.teamA, ...m.teamB]);
    expect(new Set(playerIds).size).toBe(8);

    // Away player 'e' must not be in any match
    const awayPlayer = useMatchStore.getState().players.find((p) => p.name === 'e')!;
    expect(playerIds).not.toContain(awayPlayer.id);

    // Start both matches on Court 1 and Court 2
    store.startMatch(upcoming[0].id);
    store.startMatch(upcoming[1].id);

    // Now 8 players are IN_PROGRESS, leaving only 3 active bench players off-court
    const inProgress = useMatchStore.getState().matches.filter((m) => m.status === 'IN_PROGRESS');
    expect(inProgress).toHaveLength(2);

    // No upcoming matches should exist because 3 bench players < 4 required for doubles
    const upcomingAfterStarting = useMatchStore
      .getState()
      .matches.filter((m) => m.status === 'UPCOMING');
    expect(upcomingAfterStarting).toHaveLength(0);
  });

  it('prevents starting a match if any player is already playing on another court', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2']);

    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.addPlayer('P5', true);
    store.addPlayer('P6', true);
    store.addPlayer('P7', true);
    store.addPlayer('P8', true);

    store.startSession();

    const [p1, p2, p3, p4] = useMatchStore.getState().players;

    // Start a match on Court 1 with P1, P2, P3, P4
    store.createManualMatch(
      'Court 1',
      [p1.id, p2.id],
      [p3.id, p4.id],
      true // startImmediately
    );

    // Simulate an upcoming match on Court 2 that contains P1 (who is busy on Court 1)
    const [p5, p6, p7] = useMatchStore.getState().players.slice(4);
    useMatchStore.setState((state) => ({
      matches: [
        ...state.matches,
        {
          id: 'test-conflict-match',
          courtName: 'Court 2',
          teamA: [p1.id, p5.id], // P1 is already on Court 1!
          teamB: [p6.id, p7.id],
          status: 'UPCOMING',
          syncStatus: 'LOCAL',
          isManualLineup: true,
        },
      ],
    }));

    // Attempting to start the match on Court 2 must NOT transition to IN_PROGRESS
    store.startMatch('test-conflict-match');

    const conflictMatch = useMatchStore
      .getState()
      .matches.find((m) => m.id === 'test-conflict-match');
    expect(conflictMatch?.status).toBe('UPCOMING');
  });

  it('rejects manual match creation when duplicate players are selected or players are playing', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2']);
    store.addPlayer('P1', true);
    store.addPlayer('P2', true);
    store.addPlayer('P3', true);
    store.addPlayer('P4', true);
    store.startSession();

    const [p1, p2, p3] = useMatchStore.getState().players;

    const initialMatchCount = useMatchStore.getState().matches.length;

    // Try to create manual match with duplicate player P1
    store.createManualMatch(
      'Court 1',
      [p1.id, p1.id], // duplicate!
      [p2.id, p3.id],
      false
    );

    // Should not add match
    expect(useMatchStore.getState().matches.length).toBe(initialMatchCount);
  });

  it('end-to-end: automatically shuffles teams and courts for 8 players across 2 courts after matches complete', () => {
    const store = useMatchStore.getState();
    store.setCourts(['Court 1', 'Court 2']);

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((name) => {
      store.addPlayer(name, true);
    });

    store.startSession();

    // Round 1 matches
    const r1Matches = useMatchStore.getState().matches.filter((m) => m.status === 'UPCOMING');
    expect(r1Matches).toHaveLength(2);

    const r1Court1 = r1Matches.find((m) => m.courtName === 'Court 1')!;
    const r1Court2 = r1Matches.find((m) => m.courtName === 'Court 2')!;

    // Start both matches
    store.startMatch(r1Court1.id);
    store.startMatch(r1Court2.id);

    // Complete both matches
    store.completeMatch(r1Court1.id, 15, 11);
    store.completeMatch(r1Court2.id, 15, 13);

    // Round 2 matches should now be queued
    const r2Matches = useMatchStore.getState().matches.filter((m) => m.status === 'UPCOMING');
    expect(r2Matches).toHaveLength(2);

    const r2Court1 = r2Matches.find((m) => m.courtName === 'Court 1')!;
    const r2Court2 = r2Matches.find((m) => m.courtName === 'Court 2')!;

    const r1C1Players = new Set([...r1Court1.teamA, ...r1Court1.teamB]);
    const r2C1Players = new Set([...r2Court1.teamA, ...r2Court1.teamB]);

    // Court 1 should NOT have the exact same 4 players in Round 2
    const isIdentical = [...r2C1Players].every((id) => r1C1Players.has(id));
    expect(isIdentical).toBe(false);

    // Partner pairs should NOT repeat
    const r1Partners = [
      new Set(r1Court1.teamA),
      new Set(r1Court1.teamB),
      new Set(r1Court2.teamA),
      new Set(r1Court2.teamB),
    ];
    const isR1Partner = (id1: string, id2: string) =>
      r1Partners.some((p) => p.has(id1) && p.has(id2));

    expect(isR1Partner(r2Court1.teamA[0], r2Court1.teamA[1])).toBe(false);
    expect(isR1Partner(r2Court1.teamB[0], r2Court1.teamB[1])).toBe(false);
    expect(isR1Partner(r2Court2.teamA[0], r2Court2.teamA[1])).toBe(false);
    expect(isR1Partner(r2Court2.teamB[0], r2Court2.teamB[1])).toBe(false);
  });
});
