import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from './useTournamentStore';

describe('useTournamentStore', () => {
  beforeEach(() => {
    useTournamentStore.getState().resetTournament();
  });

  it('initializes with 32 seeded teams and 63 matches (48 group + 15 knockout)', () => {
    const { teams, matches } = useTournamentStore.getState();
    expect(teams).toHaveLength(32);
    expect(matches).toHaveLength(63);

    const groupMatches = matches.filter((m) => m.stage === 'GROUP');
    expect(groupMatches).toHaveLength(48);

    const r16Matches = matches.filter((m) => m.stage === 'ROUND_OF_16');
    expect(r16Matches).toHaveLength(8);

    const qfMatches = matches.filter((m) => m.stage === 'QUARTER_FINAL');
    expect(qfMatches).toHaveLength(4);

    const sfMatches = matches.filter((m) => m.stage === 'SEMI_FINAL');
    expect(sfMatches).toHaveLength(2);

    const finalMatches = matches.filter((m) => m.stage === 'FINAL');
    expect(finalMatches).toHaveLength(1);
  });

  it('supports manually adding, editing, and removing teams', () => {
    const initialCount = useTournamentStore.getState().teams.length;

    // Add team manually
    useTournamentStore.getState().addTeam({
      player1: 'Custom Player 1',
      player2: 'Custom Player 2',
      alias: 'Thunderbirds',
      group: 'A',
    });

    const teamsAfterAdd = useTournamentStore.getState().teams;
    expect(teamsAfterAdd).toHaveLength(initialCount + 1);
    const addedTeam = teamsAfterAdd[teamsAfterAdd.length - 1];
    expect(addedTeam.player1).toBe('Custom Player 1');
    expect(addedTeam.player2).toBe('Custom Player 2');
    expect(addedTeam.alias).toBe('Thunderbirds');
    expect(addedTeam.group).toBe('A');

    // Remove team
    useTournamentStore.getState().removeTeam(addedTeam.id);
    expect(useTournamentStore.getState().teams).toHaveLength(initialCount);
  });

  it('supports clearing roster and loading sample roster', () => {
    useTournamentStore.getState().clearAllTeams();
    expect(useTournamentStore.getState().teams).toHaveLength(0);
    expect(useTournamentStore.getState().matches).toHaveLength(0);

    useTournamentStore.getState().loadSampleRoster();
    expect(useTournamentStore.getState().teams).toHaveLength(32);
  });

  it('supports tournament format switching and dynamic fixture generation', () => {
    // Switch to pure Round Robin with 4 custom teams
    useTournamentStore.getState().clearAllTeams();
    useTournamentStore.getState().addTeam({ player1: 'Alice', player2: 'Bob' });
    useTournamentStore.getState().addTeam({ player1: 'Charlie', player2: 'David' });
    useTournamentStore.getState().addTeam({ player1: 'Eve', player2: 'Frank' });
    useTournamentStore.getState().addTeam({ player1: 'Grace', player2: 'Heidi' });

    useTournamentStore.getState().setTournamentFormat('ROUND_ROBIN');
    useTournamentStore.getState().startTournament();

    const { matches, config } = useTournamentStore.getState();
    expect(config.format).toBe('ROUND_ROBIN');
    expect(config.status).toBe('ACTIVE');
    // 4 teams round robin = 4*3/2 = 6 matches
    expect(matches).toHaveLength(6);
    expect(matches[0].matchCode).toBe('RR-1');
  });

  it('assigns court to a match', () => {
    const match = useTournamentStore.getState().matches[0];
    useTournamentStore.getState().assignMatchCourt(match.id, 'Court 2');

    const updated = useTournamentStore
      .getState()
      .matches.find((m) => m.id === match.id);
    expect(updated?.courtName).toBe('Court 2');
  });

  it('starts a match and sets startTime and IN_PROGRESS status', () => {
    const match = useTournamentStore.getState().matches[0];
    useTournamentStore.getState().startMatch(match.id);

    const updated = useTournamentStore
      .getState()
      .matches.find((m) => m.id === match.id);
    expect(updated?.status).toBe('IN_PROGRESS');
    expect(updated?.startTime).toBeDefined();
  });

  it('completes a match, sets score, marks winner and stamps endTime', () => {
    const match = useTournamentStore.getState().matches[0];
    useTournamentStore.getState().completeMatch(match.id, 21, 15);

    const updated = useTournamentStore
      .getState()
      .matches.find((m) => m.id === match.id);
    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.scoreA).toBe(21);
    expect(updated?.scoreB).toBe(15);
    expect(updated?.winnerTeamId).toBe(match.teamAId);
    expect(updated?.endTime).toBeDefined();
  });

  it('edits a match score and recalculates winner', () => {
    const match = useTournamentStore.getState().matches[0];
    useTournamentStore.getState().completeMatch(match.id, 21, 15);
    // Correct typo: team B actually won 21-19
    useTournamentStore.getState().editMatchScore(match.id, 19, 21);

    const updated = useTournamentStore
      .getState()
      .matches.find((m) => m.id === match.id);
    expect(updated?.scoreA).toBe(19);
    expect(updated?.scoreB).toBe(21);
    expect(updated?.winnerTeamId).toBe(match.teamBId);
  });

  it('updates a team name / alias', () => {
    const team = useTournamentStore.getState().teams[0];
    useTournamentStore
      .getState()
      .updateTeamName(team.id, 'New Player 1', 'New Player 2', 'Super Smashers');

    const updatedTeam = useTournamentStore
      .getState()
      .teams.find((t) => t.id === team.id);
    expect(updatedTeam?.player1).toBe('New Player 1');
    expect(updatedTeam?.player2).toBe('New Player 2');
    expect(updatedTeam?.alias).toBe('Super Smashers');
  });

  it('resets tournament back to initial seed data', () => {
    const match = useTournamentStore.getState().matches[0];
    useTournamentStore.getState().completeMatch(match.id, 21, 10);
    expect(
      useTournamentStore.getState().matches.find((m) => m.id === match.id)?.status
    ).toBe('COMPLETED');

    useTournamentStore.getState().resetTournament();
    expect(
      useTournamentStore
        .getState()
        .matches.find((m) => m.matchCode === match.matchCode)?.status
    ).toBe('UPCOMING');
  });

  it('prevents setup, format, and roster changes once matches have started', () => {
    const match = useTournamentStore.getState().matches[0];
    
    // Initially hasMatchesStarted is false
    expect(useTournamentStore.getState().hasMatchesStarted()).toBe(false);

    // Start a match
    useTournamentStore.getState().startMatch(match.id);
    expect(useTournamentStore.getState().hasMatchesStarted()).toBe(true);

    // Attempting to change format should be blocked
    const originalFormat = useTournamentStore.getState().config.format;
    useTournamentStore.getState().setTournamentFormat('KNOCKOUT');
    expect(useTournamentStore.getState().config.format).toBe(originalFormat);

    // Attempting to change points format should be blocked
    const originalPoints = useTournamentStore.getState().config.pointsFormat;
    useTournamentStore.getState().setPointsFormat(21);
    expect(useTournamentStore.getState().config.pointsFormat).toBe(originalPoints);

    // Attempting to return to setup should be blocked
    useTournamentStore.getState().returnToSetup();
    expect(useTournamentStore.getState().config.status).toBe('ACTIVE');

    // Attempting to add a team should be blocked
    const teamCountBefore = useTournamentStore.getState().teams.length;
    useTournamentStore.getState().addTeam({ player1: 'Cheater 1', player2: 'Cheater 2' });
    expect(useTournamentStore.getState().teams.length).toBe(teamCountBefore);

    // Attempting to remove a team should be blocked
    useTournamentStore.getState().removeTeam(useTournamentStore.getState().teams[0].id);
    expect(useTournamentStore.getState().teams.length).toBe(teamCountBefore);

    // Attempting to clear all teams should be blocked
    useTournamentStore.getState().clearAllTeams();
    expect(useTournamentStore.getState().teams.length).toBe(teamCountBefore);

    // Attempting to load sample roster should be blocked
    useTournamentStore.getState().loadSampleRoster();
    expect(useTournamentStore.getState().teams.length).toBe(teamCountBefore);

    // Attempting to regenerate fixtures should be blocked
    const matchesBefore = useTournamentStore.getState().matches;
    useTournamentStore.getState().generateFixtures();
    expect(useTournamentStore.getState().matches).toBe(matchesBefore);
  });
});
