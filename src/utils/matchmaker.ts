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
    } else if (totalPenalty === minPenalty && minPenalty > 0) {
      // Deterministic tie-breaker: compare canonical pair keys when penalties exist
      const currentKeys = [
        getPairKey(bestCombo[0][0], bestCombo[0][1]),
        getPairKey(bestCombo[1][0], bestCombo[1][1]),
      ]
        .sort()
        .join(':');
      const candidateKeys = [
        getPairKey(combo[0][0], combo[0][1]),
        getPairKey(combo[1][0], combo[1][1]),
      ]
        .sort()
        .join(':');
      if (candidateKeys < currentKeys) {
        bestCombo = combo;
      }
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
 * Helper to generate all combinations of k elements from an array.
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  if (arr.length === k) return [arr];
  const [head, ...tail] = arr;
  const withHead = getCombinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

/**
 * Evaluates candidate 4-player combinations for a single court to maximize partner & match diversity,
 * prioritize players with lowest games, avoid back-to-back matches when bench is available,
 * and respect linked doubles teammates.
 */
function selectOptimalFourForSingleCourt(
  available: SessionPlayer[],
  history: ReturnType<typeof buildHistoryMatrices>,
  lastMatchPlayerIds?: Set<string>
): SessionPlayer[] {
  if (available.length < 4) return [];
  if (available.length === 4) return available;

  const minGames = Math.min(...available.map((p) => p.gamesPlayedToday));
  const tier0 = available.filter((p) => p.gamesPlayedToday === minGames);
  const tier1 = available.filter((p) => p.gamesPlayedToday === minGames + 1);
  const tier2 = available.filter((p) => p.gamesPlayedToday > minGames + 1);

  // Determine candidate subsets of 4 players
  let candidateFourTuples: SessionPlayer[][] = [];

  if (tier0.length >= 4) {
    // If tier0 has more than 10 players, prune to top 10 by longest wait
    const pool = [...tier0]
      .sort((a, b) => b.consecutiveGamesSatOut - a.consecutiveGamesSatOut)
      .slice(0, 10);
    candidateFourTuples = getCombinations(pool, 4);
  } else {
    // Must include all tier0 players
    const mustInclude = tier0;
    const needed = 4 - mustInclude.length;
    const pool1 = [...tier1].sort((a, b) => b.consecutiveGamesSatOut - a.consecutiveGamesSatOut);
    const pool = (pool1.length >= needed ? pool1 : [...pool1, ...tier2]).slice(0, 10);

    const combRemaining = getCombinations(pool, needed);
    candidateFourTuples = combRemaining.map((comb) => [...mustInclude, ...comb]);
  }

  if (candidateFourTuples.length === 0) return available.slice(0, 4);

  // Score each 4-tuple:
  let bestTuple = candidateFourTuples[0];
  let minScore = Infinity;

  // Check if resting players were available
  const hasRestingCandidates = available.some(
    (p) => !lastMatchPlayerIds || !lastMatchPlayerIds.has(p.id)
  );

  for (const tuple of candidateFourTuples) {
    const tupleIds = new Set(tuple.map((p) => p.id));
    let score = 0;

    // 1. Linked partner integrity: partners must not be split
    let splitsPartner = false;
    for (const p of tuple) {
      if (p.partnerId) {
        const partnerInAvailable = available.some((a) => a.id === p.partnerId);
        if (partnerInAvailable && !tupleIds.has(p.partnerId)) {
          splitsPartner = true;
          break;
        }
      }
    }
    if (splitsPartner) score += 10000;

    // 2. Back-to-back penalty
    if (lastMatchPlayerIds && hasRestingCandidates) {
      for (const p of tuple) {
        if (lastMatchPlayerIds.has(p.id)) {
          score += 60;
        }
      }
    }

    // 3. Rest wait bonus (prefer players sitting out longer)
    for (const p of tuple) {
      score -= p.consecutiveGamesSatOut * 2;
    }

    // 4. Co-occurrence penalty
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        score += history.getCoOccurrence(tuple[i].id, tuple[j].id) * 6;
      }
    }

    // 5. Best partner assignment penalty
    const pairing = pairFourPlayers(tuple, history.getPartnerCount, history.getOppCount);
    const partnerPenalty =
      history.getPartnerCount(pairing.teamA[0], pairing.teamA[1]) * 12 +
      history.getPartnerCount(pairing.teamB[0], pairing.teamB[1]) * 12;
    const oppPenalty =
      history.getOppCount(pairing.teamA[0], pairing.teamB[0]) +
      history.getOppCount(pairing.teamA[0], pairing.teamB[1]) +
      history.getOppCount(pairing.teamA[1], pairing.teamB[0]) +
      history.getOppCount(pairing.teamA[1], pairing.teamB[1]);

    score += partnerPenalty + oppPenalty * 2;

    if (score < minScore) {
      minScore = score;
      bestTuple = tuple;
    }
  }

  return bestTuple;
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
    const lastMatch = pastMatches.length > 0 ? pastMatches[pastMatches.length - 1] : undefined;
    const lastMatchPlayers = lastMatch
      ? new Set([...lastMatch.teamA, ...lastMatch.teamB])
      : undefined;
    const optimalFour = selectOptimalFourForSingleCourt(
      availablePlayers,
      history,
      lastMatchPlayers
    );
    groups = [optimalFour.length === 4 ? optimalFour : playerPool];
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
  return initialPairings.map((pairing, idx) => {
    const court = targetCourts[idx] || pairing.courtName;
    return court ? { ...pairing, courtName: court } : { ...pairing };
  });
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
  timeSlot?: string;
}

export interface SessionPlanOptions {
  totalMatches?: number;
  sessionDurationMinutes?: number;
  matchDurationMinutes?: number;
  courtNames?: string[];
  startIndex?: number;
  upcomingMatches?: { courtName: string; teamA: [string, string]; teamB: [string, string] }[];
}

export interface SessionPlanValidation {
  isFeasible: boolean;
  warnings: string[];
  metrics: {
    totalMatches: number;
    minGamesPerPlayer: number;
    maxGamesPerPlayer: number;
    uniquePartnerPairsCount: number;
    totalPossiblePairsCount: number;
    varietyScorePercent: number;
    backToBackCount: number;
  };
}

export interface SessionPlanResult {
  schedule: ProjectedMatch[];
  validation: SessionPlanValidation;
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
    const startMin = (currentMatchNum - 1) * 15;
    const endMin = currentMatchNum * 15;

    projected.push({
      matchNumber: currentMatchNum++,
      courtName: m.courtName,
      teamA: m.teamA,
      teamB: m.teamB,
      restingPlayerIds: resting,
      isQueued: true,
      timeSlot: `${startMin}–${endMin} min`,
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
    const startMin = (currentMatchNum - 1) * 15;
    const endMin = currentMatchNum * 15;

    projected.push({
      matchNumber: currentMatchNum++,
      courtName: targetCourt,
      teamA: pairing.teamA,
      teamB: pairing.teamB,
      restingPlayerIds: resting,
      isQueued: false,
      timeSlot: `${startMin}–${endMin} min`,
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

/**
 * Generates a full session sequence plan for one or more courts,
 * evaluating global constraint satisfaction, variety optimization,
 * and reporting mathematical impossibilities.
 */
export function planSessionSchedule(
  players: SessionPlayer[],
  options?: SessionPlanOptions,
  initialHistory: MatchHistoryEntry[] = []
): SessionPlanResult {
  const courtNames =
    options?.courtNames && options.courtNames.length > 0 ? options.courtNames : ['Court 1'];
  const matchDuration = options?.matchDurationMinutes || 15;
  const sessionDuration = options?.sessionDurationMinutes || 120;
  const totalMatches =
    options?.totalMatches || Math.max(1, Math.floor(sessionDuration / matchDuration));
  const startIndex = options?.startIndex ?? 1;

  const activePlayers = players.filter((p) => p.isActive);
  const warnings: string[] = [];

  if (activePlayers.length < 4 || courtNames.length === 0) {
    return {
      schedule: [],
      validation: {
        isFeasible: false,
        warnings: ['At least 4 active players and 1 court are required to plan matches.'],
        metrics: {
          totalMatches: 0,
          minGamesPerPlayer: 0,
          maxGamesPerPlayer: 0,
          uniquePartnerPairsCount: 0,
          totalPossiblePairsCount: 0,
          varietyScorePercent: 0,
          backToBackCount: 0,
        },
      },
    };
  }

  // Mathematical Impossibility Detection:
  // 1. Consecutive back-to-back impossibility on 1 court
  if (courtNames.length === 1 && activePlayers.length < 8) {
    const unavoidable = 8 - activePlayers.length;
    warnings.push(
      `Zero back-to-back matches is mathematically impossible with ${activePlayers.length} players on 1 court. At least ${unavoidable} player(s) must play consecutively in each match.`
    );
  }

  // 2. Equal games impossibility
  const totalSlots = totalMatches * 4 * courtNames.length;
  if (totalSlots % activePlayers.length !== 0) {
    const rem = totalSlots % activePlayers.length;
    warnings.push(
      `Exact equal games is mathematically impossible for ${totalMatches} matches with ${activePlayers.length} players (${totalSlots} player appearances across session). ${rem} player(s) will play 1 more game than others.`
    );
  }

  // 3. Partner slots vs max unique combinations
  const maxPossiblePairs = (activePlayers.length * (activePlayers.length - 1)) / 2;
  const partnerSlots = totalMatches * 2 * courtNames.length;
  if (partnerSlots > maxPossiblePairs) {
    warnings.push(
      `Zero repeat partners is mathematically impossible for ${totalMatches} matches (${partnerSlots} partner slots vs ${maxPossiblePairs} total unique pairs).`
    );
  }

  const simPlayers: SessionPlayer[] = activePlayers.map((p) => ({ ...p }));
  const simHistory: MatchHistoryEntry[] = [...initialHistory];
  const schedule: ProjectedMatch[] = [];
  const uniquePartnerPairs = new Set<string>();
  let backToBackCount = 0;
  let lastPlayedSet = new Set<string>();

  // 1. Process existing queued upcoming matches first
  if (options?.upcomingMatches && options.upcomingMatches.length > 0) {
    for (const m of options.upcomingMatches) {
      if (schedule.length >= totalMatches) break;
      const matchNum = startIndex + schedule.length;
      const playedIds = [...m.teamA, ...m.teamB];

      if (schedule.length > 0) {
        for (const id of playedIds) {
          if (lastPlayedSet.has(id)) backToBackCount++;
        }
      }
      lastPlayedSet = new Set(playedIds);

      uniquePartnerPairs.add(getPairKey(m.teamA[0], m.teamA[1]));
      uniquePartnerPairs.add(getPairKey(m.teamB[0], m.teamB[1]));

      const resting = simPlayers.filter((p) => !playedIds.includes(p.id)).map((p) => p.id);
      const startMin = schedule.length * matchDuration;
      const endMin = (schedule.length + 1) * matchDuration;

      schedule.push({
        matchNumber: matchNum,
        courtName: m.courtName,
        teamA: m.teamA,
        teamB: m.teamB,
        restingPlayerIds: resting,
        timeSlot: `${startMin}–${endMin} min`,
        isQueued: true,
      });

      simHistory.push({
        courtName: m.courtName,
        teamA: m.teamA,
        teamB: m.teamB,
      });

      const playedSet = new Set(playedIds);
      for (const p of simPlayers) {
        if (playedSet.has(p.id)) {
          p.gamesPlayedToday += 1;
          p.consecutiveGamesSatOut = 0;
        } else {
          p.consecutiveGamesSatOut += 1;
        }
      }
    }
  }

  // 2. Project remaining rounds to reach totalMatches
  while (schedule.length < totalMatches) {
    const matchIdx = schedule.length;
    const matchNum = startIndex + matchIdx;
    const courtName = courtNames[matchIdx % courtNames.length];
    const pairings = generateNextMatches(simPlayers, 1, [], simHistory, [courtName]);
    if (pairings.length === 0) break;

    const pairing = pairings[0];
    const playedIds = [...pairing.teamA, ...pairing.teamB];

    // Check back-to-back
    if (schedule.length > 0) {
      for (const id of playedIds) {
        if (lastPlayedSet.has(id)) {
          backToBackCount++;
        }
      }
    }
    lastPlayedSet = new Set(playedIds);

    // Track partner pairs
    uniquePartnerPairs.add(getPairKey(pairing.teamA[0], pairing.teamA[1]));
    uniquePartnerPairs.add(getPairKey(pairing.teamB[0], pairing.teamB[1]));

    const resting = simPlayers.filter((p) => !playedIds.includes(p.id)).map((p) => p.id);

    // Formatted time slot: e.g. 0–15 min, 15–30 min
    const startMin = matchIdx * matchDuration;
    const endMin = (matchIdx + 1) * matchDuration;
    const timeSlot = `${startMin}–${endMin} min`;

    schedule.push({
      matchNumber: matchNum,
      courtName,
      teamA: pairing.teamA,
      teamB: pairing.teamB,
      restingPlayerIds: resting,
      timeSlot,
      isQueued: false,
    });

    simHistory.push({
      courtName,
      teamA: pairing.teamA,
      teamB: pairing.teamB,
    });

    // Advance counters
    const playedSet = new Set(playedIds);
    for (const p of simPlayers) {
      if (playedSet.has(p.id)) {
        p.gamesPlayedToday += 1;
        p.consecutiveGamesSatOut = 0;
      } else {
        p.consecutiveGamesSatOut += 1;
      }
    }
  }

  const gamesCounts = simPlayers.map((p) => p.gamesPlayedToday);
  const minGames = Math.min(...gamesCounts);
  const maxGames = Math.max(...gamesCounts);
  const denominator = Math.min(maxPossiblePairs, partnerSlots);
  const varietyScorePercent =
    denominator > 0
      ? Math.min(100, Math.round((uniquePartnerPairs.size / denominator) * 100))
      : 100;

  return {
    schedule,
    validation: {
      isFeasible: true,
      warnings,
      metrics: {
        totalMatches: schedule.length,
        minGamesPerPlayer: minGames,
        maxGamesPerPlayer: maxGames,
        uniquePartnerPairsCount: uniquePartnerPairs.size,
        totalPossiblePairsCount: maxPossiblePairs,
        varietyScorePercent,
        backToBackCount,
      },
    },
  };
}
