import { SessionPlayer } from '../types/equiplay';

export interface GeneratedPairing {
  teamA: [string, string];
  teamB: [string, string];
  courtName?: string;
}

export interface MatchHistoryEntry {
  courtName: string;
  teamA: [string, string];
  teamB: [string, string];
}

const getPairKey = (id1: string, id2: string): string => {
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
};

/**
 * Pairs 4 players into 2 doubles teams.
 * 1. Strictly respects linked doubles partners (partnerId).
 * 2. If no linked partners, chooses the combination that minimizes repeat partner frequency,
 *    then minimizes repeat opponent frequency.
 */
export function pairFourPlayers(
  four: SessionPlayer[],
  partnerCountFn?: (id1: string, id2: string) => number,
  oppCountFn?: (id1: string, id2: string) => number
): GeneratedPairing {
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

  // 3 valid combinations for 4 players:
  const combos: [ [string, string], [string, string] ][] = [
    [[p0.id, p3.id], [p1.id, p2.id]], // Combo 0 (Standard snake-draft)
    [[p0.id, p2.id], [p1.id, p3.id]], // Combo 1
    [[p0.id, p1.id], [p2.id, p3.id]], // Combo 2
  ];

  if (!partnerCountFn) {
    // Default snake draft if no history is provided
    return {
      teamA: combos[0][0],
      teamB: combos[0][1],
    };
  }

  // Score each combination based on partner and opponent repeats
  let bestCombo = combos[0];
  let minPenalty = Infinity;

  for (const combo of combos) {
    const [tA, tB] = combo;
    const partnerPenalty =
      partnerCountFn(tA[0], tA[1]) * 10 + partnerCountFn(tB[0], tB[1]) * 10;

    const oppPenalty = oppCountFn
      ? oppCountFn(tA[0], tB[0]) +
        oppCountFn(tA[0], tB[1]) +
        oppCountFn(tA[1], tB[0]) +
        oppCountFn(tA[1], tB[1])
      : 0;

    const totalPenalty = partnerPenalty + oppPenalty;
    if (totalPenalty < minPenalty) {
      minPenalty = totalPenalty;
      bestCombo = combo;
    }
  }

  return {
    teamA: bestCombo[0],
    teamB: bestCombo[1],
  };
}

/**
 * Builds analytical lookup maps from past match history.
 */
function buildHistoryMatrices(history: MatchHistoryEntry[]) {
  const partnerMap = new Map<string, number>();
  const coOccurrenceMap = new Map<string, number>();
  const oppMap = new Map<string, number>();
  const courtCounts = new Map<string, Map<string, number>>();
  const lastCourt = new Map<string, string>();

  for (const m of history) {
    const teamA = m.teamA;
    const teamB = m.teamB;
    const allFour = [...teamA, ...teamB];

    // Partner repeats
    const keyA = getPairKey(teamA[0], teamA[1]);
    partnerMap.set(keyA, (partnerMap.get(keyA) || 0) + 1);

    const keyB = getPairKey(teamB[0], teamB[1]);
    partnerMap.set(keyB, (partnerMap.get(keyB) || 0) + 1);

    // Opponent repeats
    for (const a of teamA) {
      for (const b of teamB) {
        const key = getPairKey(a, b);
        oppMap.set(key, (oppMap.get(key) || 0) + 1);
      }
    }

    // Co-occurrence in the same match
    for (let i = 0; i < allFour.length; i++) {
      for (let j = i + 1; j < allFour.length; j++) {
        const key = getPairKey(allFour[i], allFour[j]);
        coOccurrenceMap.set(key, (coOccurrenceMap.get(key) || 0) + 1);
      }
    }

    // Court tracking
    if (m.courtName) {
      for (const p of allFour) {
        if (!courtCounts.has(p)) {
          courtCounts.set(p, new Map());
        }
        const pCourts = courtCounts.get(p)!;
        pCourts.set(m.courtName, (pCourts.get(m.courtName) || 0) + 1);
        lastCourt.set(p, m.courtName);
      }
    }
  }

  return {
    getPartnerCount: (id1: string, id2: string) => partnerMap.get(getPairKey(id1, id2)) || 0,
    getOppCount: (id1: string, id2: string) => oppMap.get(getPairKey(id1, id2)) || 0,
    getCoOccurrence: (id1: string, id2: string) => coOccurrenceMap.get(getPairKey(id1, id2)) || 0,
    getCourtCount: (playerId: string, courtName: string) =>
      courtCounts.get(playerId)?.get(courtName) || 0,
    getLastCourt: (playerId: string) => lastCourt.get(playerId),
  };
}

/**
 * Optimally partitions players into groups of 4 to maximize mix across courts,
 * then pairs teams to avoid repeat partners, and rotates court assignments.
 */
export function generateNextMatches(
  players: SessionPlayer[],
  courtsAvailable: number,
  busyPlayerIds: string[] = [],
  pastMatches: MatchHistoryEntry[] = [],
  targetCourts: string[] = []
): GeneratedPairing[] {
  // 1. Only consider players who are Active AND not already playing/queued on another court
  const availablePlayers = players.filter(
    (player) => player.isActive && !busyPlayerIds.includes(player.id)
  );

  const maxPossibleMatches = Math.floor(availablePlayers.length / 4);
  const matchesToCreate = Math.min(maxPossibleMatches, courtsAvailable);

  if (matchesToCreate <= 0) return [];

  const history = buildHistoryMatrices(pastMatches);

  // 2. Weighting Engine for Candidate Selection:
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

  // 3. Draft the exact pool of players needed for matchesToCreate
  const neededPlayerCount = matchesToCreate * 4;
  const playerPool: SessionPlayer[] = [];
  const candidateQueue = [...sortedPlayers];

  while (playerPool.length < neededPlayerCount && candidateQueue.length > 0) {
    const candidate = candidateQueue.shift()!;
    playerPool.push(candidate);

    // If candidate has a linked partner in candidateQueue and there is room, draft partner
    if (candidate.partnerId && playerPool.length < neededPlayerCount) {
      const partnerIdx = candidateQueue.findIndex((p) => p.id === candidate.partnerId);
      if (partnerIdx !== -1) {
        const [partner] = candidateQueue.splice(partnerIdx, 1);
        playerPool.push(partner);
      }
    }
  }

  if (playerPool.length < neededPlayerCount) {
    return [];
  }

  // 4. Partition playerPool into groups of 4:
  let groups: SessionPlayer[][] = [];

  if (matchesToCreate === 1) {
    groups = [playerPool];
  } else if (matchesToCreate === 2 && pastMatches.length > 0) {
    // 8 players across 2 courts: Find the partition of 8 into two 4s that minimizes match co-occurrence repeats!
    let bestScore = Infinity;
    let bestPartition: [SessionPlayer[], SessionPlayer[]] = [
      playerPool.slice(0, 4),
      playerPool.slice(4, 8),
    ];

    // Check all combinations of 4 players out of 8 (C(8,4)/2 = 35 combinations)
    const n = playerPool.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          for (let l = k + 1; l < n; l++) {
            const g1Indices = new Set([i, j, k, l]);
            const g1 = [playerPool[i], playerPool[j], playerPool[k], playerPool[l]];
            const g2 = playerPool.filter((_, idx) => !g1Indices.has(idx));

            // Respect linked partner: partners must not be split across groups!
            let splitsPartner = false;
            for (const p of g1) {
              if (p.partnerId && g2.some((other) => other.id === p.partnerId)) {
                splitsPartner = true;
                break;
              }
            }
            if (splitsPartner) continue;

            // Calculate co-occurrence penalty for g1 and g2
            let score = 0;
            for (let a = 0; a < 4; a++) {
              for (let b = a + 1; b < 4; b++) {
                score += history.getCoOccurrence(g1[a].id, g1[b].id);
                score += history.getCoOccurrence(g2[a].id, g2[b].id);
              }
            }

            if (score < bestScore) {
              bestScore = score;
              bestPartition = [g1, g2];
            }
          }
        }
      }
    }
    groups = [bestPartition[0], bestPartition[1]];
  } else {
    // Default sequential grouping (or fallback for large counts / empty history)
    const poolCopy = [...playerPool];
    while (poolCopy.length >= 4) {
      groups.push(poolCopy.splice(0, 4));
    }
  }

  // 5. For each group of 4, form teams using partner-history-aware pairing
  const initialPairings: GeneratedPairing[] = groups.map((g) =>
    pairFourPlayers(g, history.getPartnerCount, history.getOppCount)
  );

  // 6. Court Rotation: Assign each match to a court to avoid players repeating the same court
  if (targetCourts.length >= matchesToCreate && pastMatches.length > 0) {
    if (matchesToCreate === 2) {
      const courtA = targetCourts[0];
      const courtB = targetCourts[1];

      const getMatchCourtCost = (pairing: GeneratedPairing, court: string) => {
        const matchPlayers = [...pairing.teamA, ...pairing.teamB];
        let cost = 0;
        for (const pId of matchPlayers) {
          cost += history.getCourtCount(pId, court) * 2;
          if (history.getLastCourt(pId) === court) {
            cost += 4; // Extra penalty for staying on the exact same court back-to-back
          }
        }
        return cost;
      };

      // Option 1: Pairing 0 on Court A, Pairing 1 on Court B
      const costOpt1 =
        getMatchCourtCost(initialPairings[0], courtA) +
        getMatchCourtCost(initialPairings[1], courtB);

      // Option 2: Pairing 1 on Court A, Pairing 0 on Court B
      const costOpt2 =
        getMatchCourtCost(initialPairings[1], courtA) +
        getMatchCourtCost(initialPairings[0], courtB);

      if (costOpt2 < costOpt1) {
        return [
          { ...initialPairings[1], courtName: courtA },
          { ...initialPairings[0], courtName: courtB },
        ];
      } else {
        return [
          { ...initialPairings[0], courtName: courtA },
          { ...initialPairings[1], courtName: courtB },
        ];
      }
    }
  }

  // Default: assign target courts sequentially if provided
  return initialPairings.map((pairing, idx) => ({
    ...pairing,
    courtName: targetCourts[idx] || pairing.courtName,
  }));
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

export interface ProjectedMatch {
  matchNumber: number;
  courtName: string;
  teamA: [string, string];
  teamB: [string, string];
  restingPlayerIds: string[];
  isQueued?: boolean;
}

/**
 * Projects future match fixtures based on fair rotation, games played, and teammate links.
 */
export function generateProjectedSchedule(
  players: SessionPlayer[],
  courtNames: string[],
  upcomingMatches: { courtName: string; teamA: [string, string]; teamB: [string, string] }[],
  startIndex = 1,
  maxProjected = 6,
  initialHistory: MatchHistoryEntry[] = []
): ProjectedMatch[] {
  const activePlayers = players.filter((p) => p.isActive);
  if (activePlayers.length < 4 || courtNames.length === 0) return [];

  const projected: ProjectedMatch[] = [];
  let currentMatchNum = startIndex;

  // Clone players to simulate rotation progression
  const simPlayers: SessionPlayer[] = activePlayers.map((p) => ({ ...p }));
  const simHistory: MatchHistoryEntry[] = [...initialHistory];

  // Helper to advance simulation counters
  const advanceCounters = (playedIds: string[]) => {
    const playedSet = new Set(playedIds);
    for (const p of simPlayers) {
      if (playedSet.has(p.id)) {
        p.gamesPlayedToday += 1;
        p.consecutiveGamesSatOut = 0;
      } else {
        p.consecutiveGamesSatOut += 1;
      }
    }
  };

  // 1. Include existing queued UPCOMING matches first
  for (const m of upcomingMatches) {
    const playedIds = [...m.teamA, ...m.teamB];
    const resting = simPlayers.filter((p) => !playedIds.includes(p.id)).map((p) => p.id);

    projected.push({
      matchNumber: currentMatchNum++,
      courtName: m.courtName,
      teamA: m.teamA,
      teamB: m.teamB,
      restingPlayerIds: resting,
      isQueued: true,
    });

    simHistory.push({
      courtName: m.courtName,
      teamA: m.teamA,
      teamB: m.teamB,
    });

    advanceCounters(playedIds);
  }

  // 2. Project future rounds to reach maxProjected
  let courtIndex = 0;
  // If upcoming matches exist, start from next court in sequence
  if (upcomingMatches.length > 0) {
    const lastCourt = upcomingMatches[upcomingMatches.length - 1].courtName;
    const lastIdx = courtNames.indexOf(lastCourt);
    courtIndex = lastIdx !== -1 ? (lastIdx + 1) % courtNames.length : 0;
  }

  while (projected.length < maxProjected) {
    const targetCourt = courtNames[courtIndex];
    const pairings = generateNextMatches(simPlayers, 1, [], simHistory, [targetCourt]);
    if (pairings.length === 0) break;

    const pairing = pairings[0];
    const playedIds = [...pairing.teamA, ...pairing.teamB];
    const resting = simPlayers.filter((p) => !playedIds.includes(p.id)).map((p) => p.id);

    projected.push({
      matchNumber: currentMatchNum++,
      courtName: targetCourt,
      teamA: pairing.teamA,
      teamB: pairing.teamB,
      restingPlayerIds: resting,
      isQueued: false,
    });

    simHistory.push({
      courtName: targetCourt,
      teamA: pairing.teamA,
      teamB: pairing.teamB,
    });

    advanceCounters(playedIds);
    courtIndex = (courtIndex + 1) % courtNames.length;
  }

  return projected;
}
