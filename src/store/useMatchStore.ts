import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppView,
  Match,
  PointFormat,
  SessionConfig,
  SessionPlayer,
  SessionRecord,
} from '../types/equiplay';
import { generateNextMatches, reshufflePairing } from '../utils/matchmaker';

const notifyUser = (message: string) => {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  } else {
    console.warn(message);
  }
};

interface MatchStoreState {
  currentView: AppView;
  config: SessionConfig;
  players: SessionPlayer[];
  matches: Match[];
  completedSessions: SessionRecord[];

  // Navigation
  setView: (view: AppView) => void;

  // Setup Actions
  setCourts: (courts: string[]) => void;
  addCourt: (courtName: string) => void;
  removeCourt: (courtName: string) => void;
  setDuration: (minutes: number) => void;
  setPointFormat: (format: PointFormat) => void;
  startSession: () => void;

  // Player Management
  addPlayer: (name: string, isPresentNow: boolean, partnerId?: string) => void;
  removePlayer: (playerId: string) => void;
  togglePlayerActive: (playerId: string) => void;

  // Match Cycle Actions
  syncQueue: (forceRefresh?: boolean) => void;
  startMatch: (matchId: string) => void;
  completeMatch: (matchId: string, scoreA: number, scoreB: number) => void;
  reshuffleUpcoming: (matchId: string) => void;
  updateMatchLineup: (
    matchId: string,
    teamA: [string, string],
    teamB: [string, string]
  ) => void;
  swapMatchPlayer: (
    matchId: string,
    oldPlayerId: string,
    newPlayerId: string,
    markOldAsAway?: boolean
  ) => void;
  reassignMatchCourt: (matchId: string, newCourtName: string) => void;
  setPlayerPartner: (playerAId: string, playerBId: string | null) => void;
  createManualMatch: (
    courtName: string,
    teamA: [string, string],
    teamB: [string, string],
    startImmediately: boolean
  ) => void;

  // Session Control
  endSession: () => void;
  resumeSession: () => void;
  resetSession: () => void;
}

const DEFAULT_CONFIG: SessionConfig = {
  courtNames: ['Court 1'],
  bookingDurationMinutes: 120,
  pointFormat: 15,
  sessionStartTime: null,
  sessionEndTime: null,
};

export const useMatchStore = create<MatchStoreState>()(
  persist(
    (set, get) => ({
      currentView: 'SETUP',
      config: DEFAULT_CONFIG,
      players: [],
      matches: [],
      completedSessions: [],

      setView: (view) => set({ currentView: view }),

      setCourts: (courts) =>
        set((state) => ({
          config: { ...state.config, courtNames: courts.length > 0 ? courts : ['Court 1'] },
        })),

      addCourt: (courtName) =>
        set((state) => {
          const trimmed = courtName.trim();
          if (!trimmed || state.config.courtNames.includes(trimmed)) return state;
          return {
            config: {
              ...state.config,
              courtNames: [...state.config.courtNames, trimmed],
            },
          };
        }),

      removeCourt: (courtName) =>
        set((state) => {
          if (state.config.courtNames.length <= 1) return state;
          return {
            config: {
              ...state.config,
              courtNames: state.config.courtNames.filter((c) => c !== courtName),
            },
          };
        }),

      setDuration: (minutes) =>
        set((state) => ({
          config: { ...state.config, bookingDurationMinutes: Math.max(15, minutes) },
        })),

      setPointFormat: (format) =>
        set((state) => ({
          config: { ...state.config, pointFormat: format },
        })),

      addPlayer: (name, isPresentNow, partnerId?: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const newId = crypto.randomUUID();
        const newPlayer: SessionPlayer = {
          id: newId,
          name: trimmed,
          isActive: isPresentNow,
          gamesPlayedToday: 0,
          consecutiveGamesSatOut: 0,
          arrivalTime: isPresentNow ? Date.now() : undefined,
          partnerId: partnerId || undefined,
        };

        set((state) => {
          let updatedPlayers = [...state.players, newPlayer];
          if (partnerId) {
            updatedPlayers = updatedPlayers.map((p) =>
              p.id === partnerId ? { ...p, partnerId: newId } : p
            );
          }
          return { players: updatedPlayers };
        });

        // Immediately refresh queue if session has started so walk-in player is queued next!
        if (get().config.sessionStartTime && isPresentNow) {
          get().syncQueue(true);
        }
      },

      removePlayer: (playerId) => {
        const { matches } = get();
        const isBusy = matches.some(
          (m) =>
            m.status === 'IN_PROGRESS' &&
            (m.teamA.includes(playerId) || m.teamB.includes(playerId))
        );
        if (isBusy) {
          notifyUser('Cannot remove player while they are currently on court playing.');
          return;
        }

        set((state) => ({
          players: state.players.filter((p) => p.id !== playerId),
          matches: state.matches.filter(
            (m) =>
              !(
                m.status === 'UPCOMING' &&
                (m.teamA.includes(playerId) || m.teamB.includes(playerId))
              )
          ),
        }));

        get().syncQueue(true);
      },

      togglePlayerActive: (playerId) => {
        set((state) => {
          const updatedPlayers = state.players.map((player) => {
            if (player.id !== playerId) return player;
            const willBeActive = !player.isActive;
            return {
              ...player,
              isActive: willBeActive,
              arrivalTime:
                willBeActive && player.arrivalTime === undefined
                  ? Date.now()
                  : player.arrivalTime,
            };
          });

          const toggledPlayer = state.players.find((p) => p.id === playerId);
          let updatedMatches = state.matches;

          // If toggled from active to away/late, remove them from any UPCOMING matches
          if (toggledPlayer && toggledPlayer.isActive) {
            updatedMatches = state.matches.filter(
              (m) =>
                !(
                  m.status === 'UPCOMING' &&
                  (m.teamA.includes(playerId) || m.teamB.includes(playerId))
                )
            );
          }

          return {
            players: updatedPlayers,
            matches: updatedMatches,
          };
        });

        // Immediately trigger syncQueue with refresh to prioritize active bench players
        get().syncQueue(true);
      },

      setPlayerPartner: (playerAId, playerBId) => {
        set((state) => {
          const updatedPlayers = state.players.map((p) => {
            // Unlink any previous partner of A
            if (p.partnerId === playerAId && p.id !== playerBId) {
              return { ...p, partnerId: undefined };
            }
            // If linking with B, unlink previous partner of B
            if (playerBId && p.partnerId === playerBId && p.id !== playerAId) {
              return { ...p, partnerId: undefined };
            }
            // Set partner for A
            if (p.id === playerAId) {
              return { ...p, partnerId: playerBId ?? undefined };
            }
            // Set partner for B
            if (playerBId && p.id === playerBId) {
              return { ...p, partnerId: playerAId };
            }
            return p;
          });

          return { players: updatedPlayers };
        });

        if (get().config.sessionStartTime) {
          get().syncQueue(true);
        }
      },

      syncQueue: (forceRefresh = false) => {
        const { config, players, matches } = get();
        if (!config.sessionStartTime) return;

        // 1. Identify which courts have IN_PROGRESS matches and who is actively playing
        const inProgressMatches = matches.filter((m) => m.status === 'IN_PROGRESS');
        const inProgressCourtNames = new Set(inProgressMatches.map((m) => m.courtName));
        const inProgressPlayerIds = new Set<string>();
        inProgressMatches.forEach((m) => {
          m.teamA.forEach((id) => inProgressPlayerIds.add(id));
          m.teamB.forEach((id) => inProgressPlayerIds.add(id));
        });

        // 2. Identify active players (filter out away/late players)
        const activePlayerIds = new Set(players.filter((p) => p.isActive).map((p) => p.id));

        // 3. Drop any UPCOMING match containing players who are currently IN_PROGRESS or INACTIVE
        const survivingMatches = matches.filter((m) => {
          if (m.status !== 'UPCOMING') return true;
          const matchPlayers = [...m.teamA, ...m.teamB];
          const hasPlayingPlayer = matchPlayers.some((id) => inProgressPlayerIds.has(id));
          const hasInactivePlayer = matchPlayers.some((id) => !activePlayerIds.has(id));
          return !hasPlayingPlayer && !hasInactivePlayer;
        });

        const survivingUpcomingMatches = survivingMatches.filter((m) => m.status === 'UPCOMING');
        const upcomingCourtNames = new Set(survivingUpcomingMatches.map((m) => m.courtName));

        // 4. Auto-rebalance: Check if any court is completely IDLE (not playing and has no upcoming match)
        // while another court is busy playing AND holds an auto-generated upcoming match.
        const idleCourts = config.courtNames.filter(
          (c) => !inProgressCourtNames.has(c) && !upcomingCourtNames.has(c)
        );

        if (idleCourts.length > 0) {
          const misplacedMatch = survivingUpcomingMatches.find(
            (m) => !m.isManualLineup && inProgressCourtNames.has(m.courtName)
          );

          if (misplacedMatch) {
            const targetIdleCourt = idleCourts[0];
            set((state) => ({
              matches: state.matches.map((m) =>
                m.id === misplacedMatch.id ? { ...m, courtName: targetIdleCourt } : m
              ),
            }));
            return get().syncQueue(forceRefresh);
          }
        }

        // 5. Build locked players set (in-progress players are physically playing)
        const lockedPlayerIds = new Set<string>(inProgressPlayerIds);

        // 6. Preserve valid manual UPCOMING matches
        const manualUpcomingMatches = survivingUpcomingMatches.filter((m) => m.isManualLineup);
        manualUpcomingMatches.forEach((m) => {
          m.teamA.forEach((id) => lockedPlayerIds.add(id));
          m.teamB.forEach((id) => lockedPlayerIds.add(id));
        });
        const manualCourts = new Set(manualUpcomingMatches.map((m) => m.courtName));

        // 7. Auto-generated upcoming matches handling:
        let courtsNeedingUpcoming: string[];
        let keptMatches: Match[];

        if (forceRefresh) {
          // In forceRefresh mode: clear ALL auto-generated upcoming matches to re-rank fairly
          keptMatches = survivingMatches.filter(
            (m) => m.status !== 'UPCOMING' || m.isManualLineup
          );
          courtsNeedingUpcoming = config.courtNames.filter((c) => !manualCourts.has(c));
        } else {
          // In incremental mode: validate existing auto-generated upcoming matches
          const validAutoUpcoming: Match[] = [];
          for (const m of survivingUpcomingMatches) {
            if (m.isManualLineup) continue;
            const matchPlayerIds = [...m.teamA, ...m.teamB];
            const hasConflict = matchPlayerIds.some((id) => lockedPlayerIds.has(id));
            if (!hasConflict && !validAutoUpcoming.some((v) => v.courtName === m.courtName)) {
              validAutoUpcoming.push(m);
              matchPlayerIds.forEach((id) => lockedPlayerIds.add(id));
            }
          }

          const existingUpcomingCourts = new Set([
            ...manualCourts,
            ...validAutoUpcoming.map((m) => m.courtName),
          ]);

          keptMatches = [
            ...survivingMatches.filter((m) => m.status !== 'UPCOMING' || m.isManualLineup),
            ...validAutoUpcoming,
          ];

          courtsNeedingUpcoming = config.courtNames.filter((c) => !existingUpcomingCourts.has(c));
        }

        if (courtsNeedingUpcoming.length === 0) {
          if (keptMatches.length !== matches.length) {
            set({ matches: keptMatches });
          }
          return;
        }

        // Priority sort: IDLE courts with no active match come first
        courtsNeedingUpcoming.sort((courtA, courtB) => {
          const aIsPlaying = inProgressCourtNames.has(courtA);
          const bIsPlaying = inProgressCourtNames.has(courtB);
          if (!aIsPlaying && bIsPlaying) return -1;
          if (aIsPlaying && !bIsPlaying) return 1;
          return 0;
        });

        // 8. Calculate how many more matches can physically be generated
        const freeBenchPlayers = players.filter(
          (p) => p.isActive && !lockedPlayerIds.has(p.id)
        );
        const maxMoreMatchesPossible = Math.floor(freeBenchPlayers.length / 4);

        if (maxMoreMatchesPossible === 0) {
          if (keptMatches.length !== matches.length) {
            set({ matches: keptMatches });
          }
          return;
        }

        const matchesToGenerate = Math.min(maxMoreMatchesPossible, courtsNeedingUpcoming.length);
        const targetCourts = courtsNeedingUpcoming.slice(0, matchesToGenerate);

        const busyList = Array.from(lockedPlayerIds);
        const pastMatches = matches.filter(
          (m) => m.status === 'COMPLETED' || m.status === 'IN_PROGRESS'
        );
        const pairings = generateNextMatches(
          players,
          matchesToGenerate,
          busyList,
          pastMatches,
          targetCourts
        );

        if (pairings.length === 0) {
          if (keptMatches.length !== matches.length) {
            set({ matches: keptMatches });
          }
          return;
        }

        const newMatches: Match[] = pairings.map((pairing, idx) => ({
          id: crypto.randomUUID(),
          courtName: pairing.courtName || targetCourts[idx],
          teamA: pairing.teamA,
          teamB: pairing.teamB,
          status: 'UPCOMING',
          syncStatus: 'LOCAL',
          isManualLineup: false,
        }));

        set({
          matches: [...keptMatches, ...newMatches],
        });
      },

      startSession: () => {
        const { players, config } = get();
        const activeCount = players.filter((p) => p.isActive).length;
        if (activeCount < 4) {
          notifyUser('You need at least 4 active players to start a session.');
          return;
        }
        if (config.courtNames.length < 1) {
          notifyUser('You need at least 1 court to start.');
          return;
        }

        set((state) => ({
          config: {
            ...state.config,
            sessionStartTime: Date.now(),
            sessionEndTime: null,
          },
          currentView: 'DASHBOARD',
        }));

        // Trigger queue synchronization
        get().syncQueue(true);
      },

      startMatch: (matchId) => {
        const { matches, players } = get();
        const targetMatch = matches.find((m) => m.id === matchId);
        if (!targetMatch) return;

        // 1. Verify court is not already playing
        const isCourtOccupied = matches.some(
          (m) => m.courtName === targetMatch.courtName && m.status === 'IN_PROGRESS'
        );
        if (isCourtOccupied) {
          notifyUser(`${targetMatch.courtName} already has an active match in progress.`);
          return;
        }

        // 2. Verify none of the 4 players are currently playing in an active match
        const inProgressMatches = matches.filter((m) => m.status === 'IN_PROGRESS');
        const activePlayingPlayerIds = new Set<string>();
        inProgressMatches.forEach((m) => {
          m.teamA.forEach((id) => activePlayingPlayerIds.add(id));
          m.teamB.forEach((id) => activePlayingPlayerIds.add(id));
        });

        const targetPlayerIds = [...targetMatch.teamA, ...targetMatch.teamB];
        const busyConflicts = targetPlayerIds.filter((id) => activePlayingPlayerIds.has(id));
        if (busyConflicts.length > 0) {
          const names = busyConflicts
            .map((id) => players.find((p) => p.id === id)?.name || id)
            .join(', ');
          notifyUser(`Cannot start match: ${names} is/are already playing on another court!`);
          return;
        }

        // 3. Verify all 4 players are active
        const inactive = targetPlayerIds.filter((id) => {
          const p = players.find((pl) => pl.id === id);
          return !p || !p.isActive;
        });
        if (inactive.length > 0) {
          notifyUser('Cannot start match: one or more players are marked as away.');
          return;
        }

        // 4. Verify 4 distinct players
        if (new Set(targetPlayerIds).size !== 4) {
          notifyUser('Cannot start match: match must contain 4 distinct players.');
          return;
        }

        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? { ...m, status: 'IN_PROGRESS', startTime: Date.now() }
              : m
          ),
        }));

        // Incremental sync: keep other valid upcoming matches while preventing conflicts
        get().syncQueue(false);
      },

      completeMatch: (matchId, scoreA, scoreB) => {
        const { matches } = get();
        const targetMatch = matches.find((m) => m.id === matchId);
        if (!targetMatch) return;

        const playedIds = [...targetMatch.teamA, ...targetMatch.teamB];

        const updatedMatches = matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                status: 'COMPLETED' as const,
                endTime: Date.now(),
                scoreA,
                scoreB,
              }
            : m
        );

        set((state) => ({
          matches: updatedMatches,
          players: state.players.map((player) => {
            if (playedIds.includes(player.id)) {
              return {
                ...player,
                gamesPlayedToday: player.gamesPlayedToday + 1,
                consecutiveGamesSatOut: 0,
              };
            } else if (player.isActive) {
              return {
                ...player,
                consecutiveGamesSatOut: player.consecutiveGamesSatOut + 1,
              };
            }
            return player;
          }),
        }));

        // Trigger queue refresh: newly finished court can queue next match
        get().syncQueue(true);
      },

      reshuffleUpcoming: (matchId) => {
        set((state) => {
          const match = state.matches.find(
            (m) => m.id === matchId && m.status === 'UPCOMING'
          );
          if (!match) return state;

          const fourIds: [string, string, string, string] = [
            match.teamA[0],
            match.teamB[0],
            match.teamB[1],
            match.teamA[1],
          ];

          const newPairing = reshufflePairing(fourIds, match.teamA);

          return {
            matches: state.matches.map((m) =>
              m.id === matchId
                ? {
                    ...m,
                    teamA: newPairing.teamA,
                    teamB: newPairing.teamB,
                  }
                : m
            ),
          };
        });
      },

      updateMatchLineup: (matchId, teamA, teamB) => {
        const allIds = [...teamA, ...teamB];
        if (new Set(allIds).size !== 4 || allIds.some((id) => !id)) {
          notifyUser('Cannot update lineup: 4 distinct players are required.');
          return;
        }

        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  teamA,
                  teamB,
                  isManualLineup: true,
                }
              : m
          ),
        }));

        get().syncQueue(true);
      },

      swapMatchPlayer: (matchId, oldPlayerId, newPlayerId, markOldAsAway = false) => {
        const { matches } = get();
        const targetMatch = matches.find((m) => m.id === matchId);
        if (!targetMatch) return;

        const newTeamA = [...targetMatch.teamA] as [string, string];
        const newTeamB = [...targetMatch.teamB] as [string, string];

        if (newTeamA[0] === oldPlayerId) newTeamA[0] = newPlayerId;
        else if (newTeamA[1] === oldPlayerId) newTeamA[1] = newPlayerId;
        else if (newTeamB[0] === oldPlayerId) newTeamB[0] = newPlayerId;
        else if (newTeamB[1] === oldPlayerId) newTeamB[1] = newPlayerId;

        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  teamA: newTeamA,
                  teamB: newTeamB,
                  isManualLineup: true,
                }
              : m
          ),
          players: markOldAsAway
            ? state.players.map((p) =>
                p.id === oldPlayerId ? { ...p, isActive: false } : p
              )
            : state.players,
        }));

        get().syncQueue(true);
      },

      reassignMatchCourt: (matchId, newCourtName) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, courtName: newCourtName, isManualLineup: true } : m
          ),
        }));

        get().syncQueue(true);
      },

      createManualMatch: (courtName, teamA, teamB, startImmediately) => {
        const { matches, players } = get();
        const allIds = [...teamA, ...teamB];

        if (new Set(allIds).size !== 4 || allIds.some((id) => !id)) {
          notifyUser('Cannot create match: 4 distinct players are required.');
          return;
        }

        const inactivePlayers = allIds.filter((id) => {
          const p = players.find((pl) => pl.id === id);
          return !p || !p.isActive;
        });
        if (inactivePlayers.length > 0) {
          notifyUser('Cannot create match: all selected players must be active.');
          return;
        }

        const inProgressMatches = matches.filter((m) => m.status === 'IN_PROGRESS');

        if (startImmediately) {
          const isCourtBusy = inProgressMatches.some((m) => m.courtName === courtName);
          if (isCourtBusy) {
            notifyUser(`${courtName} already has an active match in progress.`);
            return;
          }

          const busyPlayerIds = new Set<string>();
          inProgressMatches.forEach((m) => {
            m.teamA.forEach((id) => busyPlayerIds.add(id));
            m.teamB.forEach((id) => busyPlayerIds.add(id));
          });

          const conflictingId = allIds.find((id) => busyPlayerIds.has(id));
          if (conflictingId) {
            const conflictName = players.find((p) => p.id === conflictingId)?.name || conflictingId;
            notifyUser(`Cannot start match: ${conflictName} is already playing on another court.`);
            return;
          }
        }

        const newMatch: Match = {
          id: crypto.randomUUID(),
          courtName,
          teamA,
          teamB,
          status: startImmediately ? 'IN_PROGRESS' : 'UPCOMING',
          startTime: startImmediately ? Date.now() : undefined,
          syncStatus: 'LOCAL',
          isManualLineup: true,
        };

        const involvedIds = new Set(allIds);

        set((state) => {
          // Remove any unstarted auto UPCOMING matches that used these players or targeted this court
          const filteredMatches = state.matches.filter((m) => {
            if (m.status !== 'UPCOMING') return true;
            if (m.courtName === courtName) return false;
            const hasConflict =
              involvedIds.has(m.teamA[0]) ||
              involvedIds.has(m.teamA[1]) ||
              involvedIds.has(m.teamB[0]) ||
              involvedIds.has(m.teamB[1]);
            return !hasConflict;
          });

          return {
            matches: [...filteredMatches, newMatch],
          };
        });

        get().syncQueue(true);
      },

      endSession: () => {
        const { config, players, matches } = get();
        const endedAt = Date.now();

        const sessionRecord: SessionRecord = {
          id: crypto.randomUUID(),
          config: {
            ...config,
            sessionEndTime: endedAt,
          },
          players,
          matches,
          endedAt,
        };

        set((state) => ({
          config: {
            ...state.config,
            sessionEndTime: endedAt,
          },
          currentView: 'SUMMARY',
          completedSessions: [sessionRecord, ...state.completedSessions],
        }));
      },

      resumeSession: () => {
        set((state) => ({
          config: {
            ...state.config,
            sessionEndTime: null,
          },
          currentView: 'DASHBOARD',
        }));
      },

      resetSession: () => {
        set({
          currentView: 'SETUP',
          config: {
            ...DEFAULT_CONFIG,
            sessionStartTime: null,
            sessionEndTime: null,
          },
          matches: [],
          players: get().players.map((p) => ({
            ...p,
            gamesPlayedToday: 0,
            consecutiveGamesSatOut: 0,
            arrivalTime: p.isActive ? Date.now() : undefined,
          })),
        });
      },
    }),
    {
      name: 'equiplay-session-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        const memoryStorage = new Map<string, string>();
        return {
          getItem: (key: string) => memoryStorage.get(key) ?? null,
          setItem: (key: string, value: string) => memoryStorage.set(key, value),
          removeItem: (key: string) => memoryStorage.delete(key),
        };
      }),
    }
  )
);
