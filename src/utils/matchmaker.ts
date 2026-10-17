import { SessionPlayer } from '../types/equiplay';

export interface GeneratedPairing {
  teamA: [string, string];
  teamB: [string, string];
}

/**
 * Pairs 4 players, ensuring linked teammates (doubles partners) play on the same team.
 */
export function pairFourPlayers(four: SessionPlayer[]): GeneratedPairing {
  const [p0, p1, p2, p3] = four;

  // Check if any two players are linked partners
  if (p0.partnerId === p1.id || p1.partnerId === p0.id) {
    return { teamA: [p0.id, p1.id], teamB: [p2.id, p3.id] };
  }
  if (p0.partnerId === p2.id || p2.partnerId === p0.id) {
    return { teamA: [p0.id, p2.id], teamB: [p1.id, p3.id] };
  }
  if (p0.partnerId === p3.id || p3.partnerId === p0.id) {
    return { teamA: [p0.id, p3.id], teamB: [p1.id, p2.id] };
  }
  if (p1.partnerId === p2.id || p2.partnerId === p1.id) {
    return { teamA: [p1.id, p2.id], teamB: [p0.id, p3.id] };
  }
  if (p1.partnerId === p3.id || p3.partnerId === p1.id) {
    return { teamA: [p1.id, p3.id], teamB: [p0.id, p2.id] };
  }
  if (p2.partnerId === p3.id || p3.partnerId === p2.id) {
    return { teamA: [p2.id, p3.id], teamB: [p0.id, p1.id] };
  }

  // Default snake draft: 0 & 3 vs 1 & 2
  return {
    teamA: [p0.id, p3.id],
    teamB: [p1.id, p2.id],
  };
}

export function generateNextMatches(
  players: SessionPlayer[],
  courtsAvailable: number,
  busyPlayerIds: string[] = []
): GeneratedPairing[] {
  // 1. Only consider players who are Active AND not already playing/queued on another court
  const availablePlayers = players.filter(
    (player) => player.isActive && !busyPlayerIds.includes(player.id)
  );

  const maxPossibleMatches = Math.floor(availablePlayers.length / 4);
  const matchesToCreate = Math.min(maxPossibleMatches, courtsAvailable);

  if (matchesToCreate <= 0) return [];

  // 2. Weighting Engine:
  // - Priority 1: Fewest games played (ASC)
  // - Priority 2: Longest bench wait (DESC)
  // - Priority 3: Earliest arrival time (ASC)
  const sortedPlayers = [...availablePlayers].sort((a, b) => {
    if (a.gamesPlayedToday !== b.gamesPlayedToday) {
      return a.gamesPlayedToday - b.gamesPlayedToday;
    }
    if (a.consecutiveGamesSatOut !== b.consecutiveGamesSatOut) {
      return b.consecutiveGamesSatOut - a.consecutiveGamesSatOut;
    }
    if (a.arrivalTime && b.arrivalTime && a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return a.name.localeCompare(b.name);
  });

  // 3. Group players into 4s, pulling linked partners together if available
  const playerPool = [...sortedPlayers];
  const generatedMatches: GeneratedPairing[] = [];

  for (let i = 0; i < matchesToCreate; i++) {
    if (playerPool.length < 4) break;

    const selected: SessionPlayer[] = [];

    while (selected.length < 4 && playerPool.length > 0) {
      const candidate = playerPool.shift()!;
      selected.push(candidate);

      // If candidate has a linked partner who is in the pool and we have room, draft partner too!
      if (candidate.partnerId && selected.length < 4) {
        const partnerIdx = playerPool.findIndex((p) => p.id === candidate.partnerId);
        if (partnerIdx !== -1) {
          const [partner] = playerPool.splice(partnerIdx, 1);
          selected.push(partner);
        }
      }
    }

    if (selected.length === 4) {
      generatedMatches.push(pairFourPlayers(selected));
    }
  }

  return generatedMatches;
}

/**
 * Reshuffle 4 players into an alternative pair combination.
 * 3 valid combinations for doubles:
 * - Combo 0: [P0, P3] vs [P1, P2] (Standard snake-draft)
 * - Combo 1: [P0, P2] vs [P1, P3] (Alternate balanced)
 * - Combo 2: [P0, P1] vs [P2, P3] (Top 2 vs Bottom 2)
 */
export function reshufflePairing(
  fourPlayerIds: [string, string, string, string],
  currentTeamA: [string, string]
): GeneratedPairing {
  const [p0, p1, p2, p3] = fourPlayerIds;

  const isCombo0 =
    (currentTeamA[0] === p0 && currentTeamA[1] === p3) ||
    (currentTeamA[0] === p3 && currentTeamA[1] === p0);
  const isCombo1 =
    (currentTeamA[0] === p0 && currentTeamA[1] === p2) ||
    (currentTeamA[0] === p2 && currentTeamA[1] === p0);

  if (isCombo0) {
    return {
      teamA: [p0, p2],
      teamB: [p1, p3],
    };
  } else if (isCombo1) {
    return {
      teamA: [p0, p1],
      teamB: [p2, p3],
    };
  } else {
    return {
      teamA: [p0, p3],
      teamB: [p1, p2],
    };
  }
}
