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
});
