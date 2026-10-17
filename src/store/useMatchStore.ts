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
          alert('Cannot remove player while they are currently on court playing.');
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

        // 1. Identify which courts have IN_PROGRESS matches
        const inProgressMatches = matches.filter((m) => m.status === 'IN_PROGRESS');
        const inProgressCourtNames = new Set(inProgressMatches.map((m) => m.courtName));

        // 2. Auto-rebalance: Check if any court is completely IDLE (not playing and has no upcoming match)
        // while another court is busy playing AND holds an auto-generated upcoming match.
        // We should immediately redirect the upcoming match to the idle court so players can play NOW!
        const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');
        const upcomingCourtNames = new Set(upcomingMatches.map((m) => m.courtName));

        const idleCourts = config.courtNames.filter(
          (c) => !inProgressCourtNames.has(c) && !upcomingCourtNames.has(c)
        );

        if (idleCourts.length > 0) {
          // Find an auto-generated upcoming match assigned to a court that is currently playing
          const misplacedMatch = upcomingMatches.find(
            (m) => !m.isManualLineup && inProgressCourtNames.has(m.courtName)
          );

          if (misplacedMatch) {
            const targetIdleCourt = idleCourts[0];
            set((state) => ({
              matches: state.matches.map((m) =>
                m.id === misplacedMatch.id ? { ...m, courtName: targetIdleCourt } : m
              ),
            }));
            // Continue syncQueue with updated assignment
            return get().syncQueue(forceRefresh);
          }
        }

        const lockedPlayerIds = new Set<string>();
        inProgressMatches.forEach((m) => {
          lockedPlayerIds.add(m.teamA[0]);
          lockedPlayerIds.add(m.teamA[1]);
          lockedPlayerIds.add(m.teamB[0]);
          lockedPlayerIds.add(m.teamB[1]);
        });

        // 3. Preserve manually edited UPCOMING matches (coordinator intentionally picked these players)
        const manualUpcomingMatches = matches.filter(
          (m) => m.status === 'UPCOMING' && m.isManualLineup
        );
        manualUpcomingMatches.forEach((m) => {
          lockedPlayerIds.add(m.teamA[0]);
          lockedPlayerIds.add(m.teamA[1]);
          lockedPlayerIds.add(m.teamB[0]);
          lockedPlayerIds.add(m.teamB[1]);
        });

        const manualCourts = new Set(manualUpcomingMatches.map((m) => m.courtName));

        // 4. For auto-generated UPCOMING matches:
        // Determine which courts need an UPCOMING match
        let courtsNeedingUpcoming: string[];

        if (forceRefresh) {
          // Re-evaluate all courts that don't have manual lineups
          courtsNeedingUpcoming = config.courtNames.filter((c) => !manualCourts.has(c));
        } else {
          // Only courts that currently don't have ANY upcoming match
          const allUpcomingCourts = new Set(
            matches.filter((m) => m.status === 'UPCOMING').map((m) => m.courtName)
          );
          courtsNeedingUpcoming = config.courtNames.filter((c) => !allUpcomingCourts.has(c));
        }

        if (courtsNeedingUpcoming.length === 0) return;

        // CRITICAL SORT: IDLE/EMPTY courts (courts with NO match in progress) MUST COME FIRST!
        // This prevents queuing matches behind busy courts when an empty court is waiting!
        courtsNeedingUpcoming.sort((courtA, courtB) => {
          const aIsPlaying = inProgressCourtNames.has(courtA);
          const bIsPlaying = inProgressCourtNames.has(courtB);
          if (!aIsPlaying && bIsPlaying) return -1; // courtA is empty -> prioritize courtA!
          if (aIsPlaying && !bIsPlaying) return 1;  // courtB is empty -> prioritize courtB!
          return 0;
        });

        // 5. Generate fair matches using all available players (not locked in progress or manual lineups)
        const busyList = Array.from(lockedPlayerIds);
        const pairings = generateNextMatches(
          players,
          courtsNeedingUpcoming.length,
          busyList
        );

        if (pairings.length === 0 && !forceRefresh) return;

        // Filter out old auto-generated UPCOMING matches for the courts being updated
        const courtsBeingUpdated = new Set(courtsNeedingUpcoming.slice(0, pairings.length));
        const filteredMatches = forceRefresh
          ? matches.filter(
              (m) =>
                m.status !== 'UPCOMING' ||
                m.isManualLineup ||
                !courtsBeingUpdated.has(m.courtName)
            )
          : matches;

        const newMatches: Match[] = pairings.map((pairing, idx) => ({
          id: crypto.randomUUID(),
          courtName: courtsNeedingUpcoming[idx],
          teamA: pairing.teamA,
          teamB: pairing.teamB,
          status: 'UPCOMING',
          syncStatus: 'LOCAL',
          isManualLineup: false,
        }));

        set(() => ({
          matches: [...filteredMatches, ...newMatches],
        }));
      },

      startSession: () => {
        const { players, config } = get();
        const activeCount = players.filter((p) => p.isActive).length;
        if (activeCount < 4) {
          alert('You need at least 4 active players to start a session.');
          return;
        }
        if (config.courtNames.length < 1) {
          alert('You need at least 1 court to start.');
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
        const { matches } = get();
        const targetMatch = matches.find((m) => m.id === matchId);
        if (!targetMatch) return;

        const isCourtOccupied = matches.some(
          (m) => m.courtName === targetMatch.courtName && m.status === 'IN_PROGRESS'
        );
        if (isCourtOccupied) {
          alert(`${targetMatch.courtName} already has an active match in progress.`);
          return;
        }

        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? { ...m, status: 'IN_PROGRESS', startTime: Date.now() }
              : m
          ),
        }));

        // Calculate next upcoming match in advance for the bench
        get().syncQueue();
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
      },

      reassignMatchCourt: (matchId, newCourtName) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, courtName: newCourtName, isManualLineup: true } : m
          ),
        }));
      },

      createManualMatch: (courtName, teamA, teamB, startImmediately) => {
        const { matches } = get();

        if (startImmediately) {
          const isCourtBusy = matches.some(
            (m) => m.courtName === courtName && m.status === 'IN_PROGRESS'
          );
          if (isCourtBusy) {
            alert(`${courtName} already has an active match in progress.`);
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

        const involvedIds = new Set([...teamA, ...teamB]);

        set((state) => {
          // Remove any unstarted auto UPCOMING matches that used these players or targeted this court
          const filteredMatches = state.matches.filter((m) => {
            if (m.status !== 'UPCOMING') return true;
            if (startImmediately && m.courtName === courtName) return false;
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
