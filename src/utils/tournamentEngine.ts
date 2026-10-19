import {
  GroupId,
  GroupStanding,
  TournamentFormat,
  TournamentMatch,
  TournamentTeam,
} from '../types/tournament';
import { TOURNAMENT_GROUPS } from '../data/tournamentSeed';

/**
 * Generate group stage fixtures for a group of teams.
 * If 4 teams, generates 6 matches in the exact order:
 * Match 1: T1 vs T4
 * Match 2: T2 vs T3
 * Match 3: T1 vs T3
 * Match 4: T4 vs T2
 * Match 5: T1 vs T2
 * Match 6: T3 vs T4
 * If other team sizes, generates round-robin pairs.
 */
export function generateGroupMatches(
  group: GroupId,
  groupTeams: TournamentTeam[]
): TournamentMatch[] {
  if (groupTeams.length < 2) return [];

  if (groupTeams.length === 4) {
    const [t1, t2, t3, t4] = groupTeams;

    const pairings: Array<{ teamA: TournamentTeam; teamB: TournamentTeam; matchIndex: number }> = [
      { teamA: t1, teamB: t4, matchIndex: 1 },
      { teamA: t2, teamB: t3, matchIndex: 2 },
      { teamA: t1, teamB: t3, matchIndex: 3 },
      { teamA: t4, teamB: t2, matchIndex: 4 },
      { teamA: t1, teamB: t2, matchIndex: 5 },
      { teamA: t3, teamB: t4, matchIndex: 6 },
    ];

    return pairings.map(({ teamA, teamB, matchIndex }) => ({
      id: crypto.randomUUID(),
      matchCode: `G-${group}-${matchIndex}`,
      stage: 'GROUP',
      group,
      teamAId: teamA.id,
      teamBId: teamB.id,
      status: 'UPCOMING',
    }));
  }

  // General round-robin for any group size
  const matches: TournamentMatch[] = [];
  let matchIndex = 1;
  for (let i = 0; i < groupTeams.length; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      matches.push({
        id: crypto.randomUUID(),
        matchCode: `G-${group}-${matchIndex++}`,
        stage: 'GROUP',
        group,
        teamAId: groupTeams[i].id,
        teamBId: groupTeams[j].id,
        status: 'UPCOMING',
      });
    }
  }
  return matches;
}

/**
 * Generate pure round-robin matches where every team plays every other team.
 */
export function generateRoundRobinMatches(teams: TournamentTeam[]): TournamentMatch[] {
  const matches: TournamentMatch[] = [];
  let matchIndex = 1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: crypto.randomUUID(),
        matchCode: `RR-${matchIndex++}`,
        stage: 'GROUP',
        teamAId: teams[i].id,
        teamBId: teams[j].id,
        status: 'UPCOMING',
      });
    }
  }
  return matches;
}

/**
 * Generate all group matches for groups that have teams.
 */
export function generateAllGroupMatches(teams: TournamentTeam[]): TournamentMatch[] {
  const matches: TournamentMatch[] = [];

  for (const group of TOURNAMENT_GROUPS) {
    const groupTeams = teams.filter((t) => t.group === group);
    if (groupTeams.length >= 2) {
      matches.push(...generateGroupMatches(group, groupTeams));
    }
  }

  return matches;
}

/**
 * Generate initial empty knockout bracket matches (R16, QF, SF, Final).
 */
export function generateInitialKnockoutMatches(): TournamentMatch[] {
  const matches: TournamentMatch[] = [];

  // Round of 16 (8 matches)
  for (let i = 1; i <= 8; i++) {
    matches.push({
      id: crypto.randomUUID(),
      matchCode: `R16-${i}`,
      stage: 'ROUND_OF_16',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
  }

  // Quarter Finals (4 matches)
  for (let i = 1; i <= 4; i++) {
    matches.push({
      id: crypto.randomUUID(),
      matchCode: `QF-${i}`,
      stage: 'QUARTER_FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
  }

  // Semi Finals (2 matches)
  for (let i = 1; i <= 2; i++) {
    matches.push({
      id: crypto.randomUUID(),
      matchCode: `SF-${i}`,
      stage: 'SEMI_FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
  }

  // Final (1 match)
  matches.push({
    id: crypto.randomUUID(),
    matchCode: 'FINAL',
    stage: 'FINAL',
    teamAId: '',
    teamBId: '',
    status: 'UPCOMING',
  });

  return matches;
}

/**
 * Compute standings dynamically for a group based on COMPLETED matches.
 * Tie-Breaker Priority:
 * 1. Total Wins (Descending)
 * 2. Head-to-Head Result (if 2 teams are tied on wins)
 * 3. Point Differential (pointsFor - pointsAgainst) (Descending)
 * 4. Total Points For (Descending)
 * 5. Fallback: teamNumber (Ascending)
 * Top 2 teams are marked with isQualified: true.
 */
export function computeGroupStandings(
  group: GroupId,
  teams: TournamentTeam[],
  matches: TournamentMatch[]
): GroupStanding[] {
  const groupTeams = teams.filter((t) => t.group === group);
  const completedGroupMatches = matches.filter(
    (m) => m.group === group && m.status === 'COMPLETED'
  );

  const standings: GroupStanding[] = groupTeams.map((team) => {
    let played = 0;
    let won = 0;
    let lost = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const match of completedGroupMatches) {
      if (match.teamAId === team.id) {
        played += 1;
        const sA = match.scoreA ?? 0;
        const sB = match.scoreB ?? 0;
        pointsFor += sA;
        pointsAgainst += sB;
        if (match.winnerTeamId === team.id) {
          won += 1;
        } else {
          lost += 1;
        }
      } else if (match.teamBId === team.id) {
        played += 1;
        const sA = match.scoreA ?? 0;
        const sB = match.scoreB ?? 0;
        pointsFor += sB;
        pointsAgainst += sA;
        if (match.winnerTeamId === team.id) {
          won += 1;
        } else {
          lost += 1;
        }
      }
    }

    const teamName = team.alias
      ? `${team.player1} & ${team.player2} (${team.alias})`
      : `${team.player1} & ${team.player2}`;

    return {
      teamId: team.id,
      teamNumber: team.teamNumber,
      teamName,
      played,
      won,
      lost,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      isQualified: false,
    };
  });

  // Sort standings with strict tie-breaker priority
  standings.sort((a, b) => {
    // 1. Total Wins (Descending)
    if (b.won !== a.won) {
      return b.won - a.won;
    }

    // 2. Head-to-Head Result: check if exactly 2 teams have this win count
    const teamsWithSameWins = standings.filter((s) => s.won === a.won);
    if (teamsWithSameWins.length === 2) {
      const h2hMatch = completedGroupMatches.find(
        (m) =>
          (m.teamAId === a.teamId && m.teamBId === b.teamId) ||
          (m.teamAId === b.teamId && m.teamBId === a.teamId)
      );
      if (h2hMatch && h2hMatch.winnerTeamId) {
        if (h2hMatch.winnerTeamId === a.teamId) return -1;
        if (h2hMatch.winnerTeamId === b.teamId) return 1;
      }
    }

    // 3. Point Differential (Descending)
    if (b.pointDiff !== a.pointDiff) {
      return b.pointDiff - a.pointDiff;
    }

    // 4. Total Points For (Descending)
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }

    // 5. Team Number (Ascending stable sort)
    return a.teamNumber - b.teamNumber;
  });

  // Mark top 2 teams with isQualified: true
  return standings.map((standing, index) => ({
    ...standing,
    isQualified: index < 2,
  }));
}

/**
 * Compute standings for all 8 groups.
 */
export function computeAllStandings(
  teams: TournamentTeam[],
  matches: TournamentMatch[]
): Record<GroupId, GroupStanding[]> {
  const allStandings = {} as Record<GroupId, GroupStanding[]>;
  for (const group of TOURNAMENT_GROUPS) {
    allStandings[group] = computeGroupStandings(group, teams, matches);
  }
  return allStandings;
}

/**
 * Check if all 6 matches in a group are completed.
 */
export function isGroupFinished(group: GroupId, matches: TournamentMatch[]): boolean {
  const groupMatches = matches.filter((m) => m.group === group);
  return (
    groupMatches.length === 6 &&
    groupMatches.every((m) => m.status === 'COMPLETED')
  );
}

/**
 * Synchronize the Knockout Bracket based on group standings and completed knockout matches.
 * Cross-group Round-of-16 pairing specification:
 * R16-1: 1st Group A vs 2nd Group B
 * R16-2: 1st Group C vs 2nd Group D
 * R16-3: 1st Group E vs 2nd Group F
 * R16-4: 1st Group G vs 2nd Group H
 * R16-5: 1st Group B vs 2nd Group A
 * R16-6: 1st Group D vs 2nd Group C
 * R16-7: 1st Group F vs 2nd Group E
 * R16-8: 1st Group H vs 2nd Group G
 */
export function syncKnockoutTree(
  allMatches: TournamentMatch[],
  teams: TournamentTeam[]
): TournamentMatch[] {
  const standings = computeAllStandings(teams, allMatches);
  const updatedMatches = [...allMatches];

  const getGroupTopTwo = (group: GroupId) => {
    const groupStanding = standings[group];
    return {
      first: groupStanding[0]?.teamId ?? '',
      second: groupStanding[1]?.teamId ?? '',
    };
  };

  const groupA = getGroupTopTwo('A');
  const groupB = getGroupTopTwo('B');
  const groupC = getGroupTopTwo('C');
  const groupD = getGroupTopTwo('D');
  const groupE = getGroupTopTwo('E');
  const groupF = getGroupTopTwo('F');
  const groupG = getGroupTopTwo('G');
  const groupH = getGroupTopTwo('H');

  // Pairings mapping: [matchCode, teamAId, teamBId]
  const r16Assignments: Record<string, { teamA: string; teamB: string }> = {
    'R16-1': { teamA: groupA.first, teamB: groupB.second },
    'R16-2': { teamA: groupC.first, teamB: groupD.second },
    'R16-3': { teamA: groupE.first, teamB: groupF.second },
    'R16-4': { teamA: groupG.first, teamB: groupH.second },
    'R16-5': { teamA: groupB.first, teamB: groupA.second },
    'R16-6': { teamA: groupD.first, teamB: groupC.second },
    'R16-7': { teamA: groupF.first, teamB: groupE.second },
    'R16-8': { teamA: groupH.first, teamB: groupG.second },
  };

  // 1. Update R16 matches
  for (let i = 0; i < updatedMatches.length; i++) {
    const m = updatedMatches[i];
    if (m.stage === 'ROUND_OF_16' && r16Assignments[m.matchCode]) {
      const assignment = r16Assignments[m.matchCode];
      const newTeamA = assignment.teamA;
      const newTeamB = assignment.teamB;

      if (m.teamAId !== newTeamA || m.teamBId !== newTeamB) {
        // If teams changed and match was completed with old teams, reset status
        const resetStatus =
          (m.teamAId && m.teamAId !== newTeamA) ||
          (m.teamBId && m.teamBId !== newTeamB);

        updatedMatches[i] = {
          ...m,
          teamAId: newTeamA,
          teamBId: newTeamB,
          status: resetStatus ? 'UPCOMING' : m.status,
          scoreA: resetStatus ? undefined : m.scoreA,
          scoreB: resetStatus ? undefined : m.scoreB,
          winnerTeamId: resetStatus ? undefined : m.winnerTeamId,
        };
      }
    }
  }

  // Helper to get winner of a matchCode
  const getWinnerOf = (matchCode: string): string => {
    const match = updatedMatches.find((m) => m.matchCode === matchCode);
    return match && match.status === 'COMPLETED' ? (match.winnerTeamId ?? '') : '';
  };

  // 2. Quarterfinals
  // QF-1: Winner R16-1 vs Winner R16-2
  // QF-2: Winner R16-3 vs Winner R16-4
  // QF-3: Winner R16-5 vs Winner R16-6
  // QF-4: Winner R16-7 vs Winner R16-8
  const qfAssignments: Record<string, { teamA: string; teamB: string }> = {
    'QF-1': { teamA: getWinnerOf('R16-1'), teamB: getWinnerOf('R16-2') },
    'QF-2': { teamA: getWinnerOf('R16-3'), teamB: getWinnerOf('R16-4') },
    'QF-3': { teamA: getWinnerOf('R16-5'), teamB: getWinnerOf('R16-6') },
    'QF-4': { teamA: getWinnerOf('R16-7'), teamB: getWinnerOf('R16-8') },
  };

  for (let i = 0; i < updatedMatches.length; i++) {
    const m = updatedMatches[i];
    if (m.stage === 'QUARTER_FINAL' && qfAssignments[m.matchCode]) {
      const assignment = qfAssignments[m.matchCode];
      const newTeamA = assignment.teamA;
      const newTeamB = assignment.teamB;

      if (m.teamAId !== newTeamA || m.teamBId !== newTeamB) {
        const resetStatus =
          (m.teamAId && m.teamAId !== newTeamA) ||
          (m.teamBId && m.teamBId !== newTeamB);

        updatedMatches[i] = {
          ...m,
          teamAId: newTeamA,
          teamBId: newTeamB,
          status: resetStatus ? 'UPCOMING' : m.status,
          scoreA: resetStatus ? undefined : m.scoreA,
          scoreB: resetStatus ? undefined : m.scoreB,
          winnerTeamId: resetStatus ? undefined : m.winnerTeamId,
        };
      }
    }
  }

  // 3. Semifinals
  // SF-1: Winner QF-1 vs Winner QF-2
  // SF-2: Winner QF-3 vs Winner QF-4
  const sfAssignments: Record<string, { teamA: string; teamB: string }> = {
    'SF-1': { teamA: getWinnerOf('QF-1'), teamB: getWinnerOf('QF-2') },
    'SF-2': { teamA: getWinnerOf('QF-3'), teamB: getWinnerOf('QF-4') },
  };

  for (let i = 0; i < updatedMatches.length; i++) {
    const m = updatedMatches[i];
    if (m.stage === 'SEMI_FINAL' && sfAssignments[m.matchCode]) {
      const assignment = sfAssignments[m.matchCode];
      const newTeamA = assignment.teamA;
      const newTeamB = assignment.teamB;

      if (m.teamAId !== newTeamA || m.teamBId !== newTeamB) {
        const resetStatus =
          (m.teamAId && m.teamAId !== newTeamA) ||
          (m.teamBId && m.teamBId !== newTeamB);

        updatedMatches[i] = {
          ...m,
          teamAId: newTeamA,
          teamBId: newTeamB,
          status: resetStatus ? 'UPCOMING' : m.status,
          scoreA: resetStatus ? undefined : m.scoreA,
          scoreB: resetStatus ? undefined : m.scoreB,
          winnerTeamId: resetStatus ? undefined : m.winnerTeamId,
        };
      }
    }
  }

  // 4. Final
  // FINAL: Winner SF-1 vs Winner SF-2
  const finalAssignment = {
    teamA: getWinnerOf('SF-1'),
    teamB: getWinnerOf('SF-2'),
  };

  for (let i = 0; i < updatedMatches.length; i++) {
    const m = updatedMatches[i];
    if (m.stage === 'FINAL') {
      const newTeamA = finalAssignment.teamA;
      const newTeamB = finalAssignment.teamB;

      if (m.teamAId !== newTeamA || m.teamBId !== newTeamB) {
        const resetStatus =
          (m.teamAId && m.teamAId !== newTeamA) ||
          (m.teamBId && m.teamBId !== newTeamB);

        updatedMatches[i] = {
          ...m,
          teamAId: newTeamA,
          teamBId: newTeamB,
          status: resetStatus ? 'UPCOMING' : m.status,
          scoreA: resetStatus ? undefined : m.scoreA,
          scoreB: resetStatus ? undefined : m.scoreB,
          winnerTeamId: resetStatus ? undefined : m.winnerTeamId,
        };
      }
    }
  }

  return updatedMatches;
}

/**
 * Helper to get a team object by ID.
 */
export function getTournamentTeam(
  teamId: string,
  teams: TournamentTeam[]
): TournamentTeam | undefined {
  if (!teamId) return undefined;
  return teams.find((t) => t.id === teamId);
}

/**
 * Format a team name for UI display.
 */
export function formatTeamName(team?: TournamentTeam): string {
  if (!team) return 'TBD';
  if (team.alias) {
    return `${team.player1} & ${team.player2} (${team.alias})`;
  }
  return `${team.player1} & ${team.player2}`;
}

/**
 * Placeholder title for unseeded knockout slots.
 */
export function getKnockoutSlotPlaceholder(
  matchCode: string,
  slot: 'A' | 'B'
): string {
  switch (matchCode) {
    case 'R16-1':
      return slot === 'A' ? '1st Group A' : '2nd Group B';
    case 'R16-2':
      return slot === 'A' ? '1st Group C' : '2nd Group D';
    case 'R16-3':
      return slot === 'A' ? '1st Group E' : '2nd Group F';
    case 'R16-4':
      return slot === 'A' ? '1st Group G' : '2nd Group H';
    case 'R16-5':
      return slot === 'A' ? '1st Group B' : '2nd Group A';
    case 'R16-6':
      return slot === 'A' ? '1st Group D' : '2nd Group C';
    case 'R16-7':
      return slot === 'A' ? '1st Group F' : '2nd Group E';
    case 'R16-8':
      return slot === 'A' ? '1st Group H' : '2nd Group G';
    case 'QF-1':
      return slot === 'A' ? 'Winner R16-1' : 'Winner R16-2';
    case 'QF-2':
      return slot === 'A' ? 'Winner R16-3' : 'Winner R16-4';
    case 'QF-3':
      return slot === 'A' ? 'Winner R16-5' : 'Winner R16-6';
    case 'QF-4':
      return slot === 'A' ? 'Winner R16-7' : 'Winner R16-8';
    case 'SF-1':
      return slot === 'A' ? 'Winner QF-1' : 'Winner QF-2';
    case 'SF-2':
      return slot === 'A' ? 'Winner QF-3' : 'Winner QF-4';
    case 'FINAL':
      return slot === 'A' ? 'Winner SF-1' : 'Winner SF-2';
    default:
      return 'TBD';
  }
}

/**
 * Compute standings for pure Round Robin (all teams in one league).
 */
export function computeRoundRobinStandings(
  teams: TournamentTeam[],
  matches: TournamentMatch[]
): GroupStanding[] {
  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

  const standings: GroupStanding[] = teams.map((team) => {
    let played = 0;
    let won = 0;
    let lost = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const match of completedMatches) {
      if (match.teamAId === team.id) {
        played += 1;
        const sA = match.scoreA ?? 0;
        const sB = match.scoreB ?? 0;
        pointsFor += sA;
        pointsAgainst += sB;
        if (match.winnerTeamId === team.id) {
          won += 1;
        } else {
          lost += 1;
        }
      } else if (match.teamBId === team.id) {
        played += 1;
        const sA = match.scoreA ?? 0;
        const sB = match.scoreB ?? 0;
        pointsFor += sB;
        pointsAgainst += sA;
        if (match.winnerTeamId === team.id) {
          won += 1;
        } else {
          lost += 1;
        }
      }
    }

    const teamName = team.alias
      ? `${team.player1} & ${team.player2} (${team.alias})`
      : `${team.player1} & ${team.player2}`;

    return {
      teamId: team.id,
      teamNumber: team.teamNumber,
      teamName,
      played,
      won,
      lost,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      isQualified: false,
    };
  });

  standings.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    const sameWins = standings.filter((s) => s.won === a.won);
    if (sameWins.length === 2) {
      const h2h = completedMatches.find(
        (m) =>
          (m.teamAId === a.teamId && m.teamBId === b.teamId) ||
          (m.teamAId === b.teamId && m.teamBId === a.teamId)
      );
      if (h2h && h2h.winnerTeamId) {
        if (h2h.winnerTeamId === a.teamId) return -1;
        if (h2h.winnerTeamId === b.teamId) return 1;
      }
    }
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.teamNumber - b.teamNumber;
  });

  // Champion is rank 1, Runner-up rank 2
  return standings.map((s, idx) => ({
    ...s,
    isQualified: idx < 2,
  }));
}

/**
 * Generate bracket for pure knockout mode based on number of teams.
 */
export function generatePureKnockoutMatches(teams: TournamentTeam[]): TournamentMatch[] {
  const matches: TournamentMatch[] = [];
  const count = teams.length;

  if (count <= 4) {
    // 2 Semis + 1 Final
    matches.push({
      id: crypto.randomUUID(),
      matchCode: 'SF-1',
      stage: 'SEMI_FINAL',
      teamAId: teams[0]?.id ?? '',
      teamBId: teams[1]?.id ?? '',
      status: 'UPCOMING',
    });
    matches.push({
      id: crypto.randomUUID(),
      matchCode: 'SF-2',
      stage: 'SEMI_FINAL',
      teamAId: teams[2]?.id ?? '',
      teamBId: teams[3]?.id ?? '',
      status: 'UPCOMING',
    });
    matches.push({
      id: crypto.randomUUID(),
      matchCode: 'FINAL',
      stage: 'FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
    return matches;
  }

  if (count <= 8) {
    // 4 QFs + 2 SFs + 1 Final
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: crypto.randomUUID(),
        matchCode: `QF-${i + 1}`,
        stage: 'QUARTER_FINAL',
        teamAId: teams[i * 2]?.id ?? '',
        teamBId: teams[i * 2 + 1]?.id ?? '',
        status: 'UPCOMING',
      });
    }
    matches.push({
      id: crypto.randomUUID(),
      matchCode: 'SF-1',
      stage: 'SEMI_FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
    matches.push({
      id: crypto.randomUUID(),
      matchCode: 'SF-2',
      stage: 'SEMI_FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
    matches.push({
      id: crypto.randomUUID(),
      matchCode: 'FINAL',
      stage: 'FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
    return matches;
  }

  // 16 teams: 8 R16 + 4 QF + 2 SF + 1 Final
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: crypto.randomUUID(),
      matchCode: `R16-${i + 1}`,
      stage: 'ROUND_OF_16',
      teamAId: teams[i * 2]?.id ?? '',
      teamBId: teams[i * 2 + 1]?.id ?? '',
      status: 'UPCOMING',
    });
  }
  for (let i = 1; i <= 4; i++) {
    matches.push({
      id: crypto.randomUUID(),
      matchCode: `QF-${i}`,
      stage: 'QUARTER_FINAL',
      teamAId: '',
      teamBId: '',
      status: 'UPCOMING',
    });
  }
  matches.push({
    id: crypto.randomUUID(),
    matchCode: 'SF-1',
    stage: 'SEMI_FINAL',
    teamAId: '',
    teamBId: '',
    status: 'UPCOMING',
  });
  matches.push({
    id: crypto.randomUUID(),
    matchCode: 'SF-2',
    stage: 'SEMI_FINAL',
    teamAId: '',
    teamBId: '',
    status: 'UPCOMING',
  });
  matches.push({
    id: crypto.randomUUID(),
    matchCode: 'FINAL',
    stage: 'FINAL',
    teamAId: '',
    teamBId: '',
    status: 'UPCOMING',
  });

  return matches;
}

/**
 * Unified Tournament Match Generator based on format and entered teams.
 */
export function generateTournamentMatches(
  format: TournamentFormat,
  teams: TournamentTeam[]
): TournamentMatch[] {
  if (format === 'ROUND_ROBIN') {
    return generateRoundRobinMatches(teams);
  }
  if (format === 'GROUP_KNOCKOUT' || format === 'GROUP_CONSOLATION') {
    const groupMatches = generateAllGroupMatches(teams);
    const knockoutMatches = generateInitialKnockoutMatches();
    return syncKnockoutTree([...groupMatches, ...knockoutMatches], teams);
  }
  return generatePureKnockoutMatches(teams);
}

