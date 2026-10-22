import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GroupId,
  SyncStatus,
  TournamentConfig,
  TournamentFormat,
  TournamentMatch,
  TournamentPointFormat,
  TournamentSettings,
  TournamentStage,
  TournamentState,
  TournamentTab,
  TournamentTeam,
} from '../types/tournament';
import { SEEDED_TOURNAMENT_TEAMS } from '../data/tournamentSeed';
import {
  DEFAULT_EBC_SETTINGS,
  generateTournamentMatches,
  syncKnockoutTree,
} from '../utils/tournamentEngine';
import { syncService } from '../services/syncService';

export interface TournamentStoreState {
  tournamentId: string;
  config: TournamentConfig;
  settings: TournamentSettings;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  courts: string[];
  syncStatus: SyncStatus;

  // Filter & Navigation State
  activeTab: TournamentTab;
  selectedGroupFilter: GroupId | 'ALL';
  selectedStageFilter: TournamentStage | 'ALL';
  selectedCourtFilter: string; // 'ALL' or specific court name

  // Config & Tournament Setup Actions
  hasMatchesStarted: () => boolean;
  setConfig: (updates: Partial<TournamentConfig>) => void;
  setSettings: (updates: Partial<TournamentSettings>) => void;
  setTournamentFormat: (format: TournamentFormat) => void;
  setPointsFormat: (points: TournamentPointFormat) => void;
  startTournament: () => void;
  returnToSetup: () => void;
  triggerSync: () => Promise<void>;

  // Manual Roster & Team Actions
  addTeam: (team: {
    player1: string;
    player2?: string;
    alias?: string;
    group?: GroupId;
    teamNumber?: number;
  }) => void;
  removeTeam: (teamId: string) => void;
  loadSampleRoster: () => void;
  clearAllTeams: () => void;
  generateFixtures: () => void;

  // Navigation / Filter Actions
  setActiveTab: (tab: TournamentTab) => void;
  setSelectedGroupFilter: (group: GroupId | 'ALL') => void;
  setSelectedStageFilter: (stage: TournamentStage | 'ALL') => void;
  setSelectedCourtFilter: (court: string) => void;

  // Court Management Actions
  addCourt: (courtName: string) => void;
  removeCourt: (courtName: string) => void;

  // Match Cycle Actions
  assignMatchCourt: (matchId: string, courtName: string) => void;
  autoAssignCourts: () => void;
  startMatch: (matchId: string) => void;
  completeMatch: (matchId: string, scoreA: number, scoreB: number) => void;
  editMatchScore: (matchId: string, scoreA: number, scoreB: number) => void;
  awardWalkover: (matchId: string, winningTeamId: string) => void;

  // Roster & Reset Actions
  updateTeamName: (
    teamId: string,
    newPlayer1: string,
    newPlayer2: string,
    newAlias?: string,
    newGroup?: GroupId
  ) => void;
  resetTournament: () => void;
}

const DEFAULT_TOURNAMENT_ID = 'ebc-2026';

const DEFAULT_CONFIG: TournamentConfig = {
  name: 'EBC Badminton Championship',
  format: 'GROUP_KNOCKOUT',
  pointsFormat: 21,
  isDoubles: true,
  status: 'ACTIVE',
};

function createInitialTournamentData(): {
  tournamentId: string;
  config: TournamentConfig;
  settings: TournamentSettings;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  courts: string[];
} {
  const teams = [...SEEDED_TOURNAMENT_TEAMS];
  const courts = [...DEFAULT_EBC_SETTINGS.courts];
  const allMatches = generateTournamentMatches('GROUP_KNOCKOUT', teams, courts);
  return {
    tournamentId: DEFAULT_TOURNAMENT_ID,
    config: { ...DEFAULT_CONFIG },
    settings: { ...DEFAULT_EBC_SETTINGS },
    teams,
    matches: allMatches,
    courts,
  };
}

export const useTournamentStore = create<TournamentStoreState>()(
  persist(
    (set, get) => {
      const initialData = createInitialTournamentData();

      const triggerBackgroundSync = async () => {
        const state = get();
        set({ syncStatus: 'PENDING' });
        try {
          const payload: TournamentState = {
            tournamentId: state.tournamentId,
            config: state.config,
            settings: state.settings,
            teams: state.teams,
            matches: state.matches,
            courts: state.courts,
            updatedAt: Date.now(),
          };
          await syncService.syncTournamentState(state.tournamentId, payload);
          set({ syncStatus: 'SYNCED' });
        } catch {
          set({ syncStatus: 'LOCAL' });
        }
      };

      return {
        tournamentId: initialData.tournamentId,
        config: initialData.config,
        settings: initialData.settings,
        teams: initialData.teams,
        matches: initialData.matches,
        courts: initialData.courts,
        syncStatus: 'SYNCED',

        activeTab: 'FIXTURES',
        selectedGroupFilter: 'ALL',
        selectedStageFilter: 'ALL',
        selectedCourtFilter: 'ALL',

        // Helpers
        hasMatchesStarted: () => {
          return get().matches.some((m) => m.status !== 'UPCOMING');
        },

        triggerSync: triggerBackgroundSync,

        // Config actions
        setConfig: (updates) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot change setup configuration after matches have started.');
            return;
          }
          set((state) => ({ config: { ...state.config, ...updates } }));
          triggerBackgroundSync();
        },

        setSettings: (updates) => {
          set((state) => {
            const newSettings = { ...state.settings, ...updates };
            // If courts updated, sync courts list
            const newCourts = updates.courts ? updates.courts : state.courts;
            // Also update config tournament name if changed
            const newConfig = updates.tournamentName
              ? { ...state.config, name: updates.tournamentName }
              : state.config;

            return {
              settings: newSettings,
              courts: newCourts,
              config: newConfig,
            };
          });
          triggerBackgroundSync();
        },

        setTournamentFormat: (format) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot change tournament format after matches have started.');
            return;
          }
          set((state) => ({ config: { ...state.config, format } }));
          triggerBackgroundSync();
        },

        setPointsFormat: (points) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot change points format after matches have started.');
            return;
          }
          set((state) => ({
            config: { ...state.config, pointsFormat: points },
            settings: {
              ...state.settings,
              groupStageFormat: {
                ...state.settings.groupStageFormat,
                targetPoints: points,
              },
            },
          }));
          triggerBackgroundSync();
        },

        startTournament: () => {
          const { config, teams, courts } = get();
          const generatedMatches = generateTournamentMatches(config.format, teams, courts);
          set((state) => ({
            config: { ...state.config, status: 'ACTIVE' },
            matches: generatedMatches,
            activeTab: 'FIXTURES',
          }));
          triggerBackgroundSync();
        },

        returnToSetup: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot return to setup once matches have started. Reset tournament first.');
            return;
          }
          set((state) => ({
            config: { ...state.config, status: 'SETUP' },
          }));
          triggerBackgroundSync();
        },

        // Manual Team Management
        addTeam: (teamData) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot add teams after matches have started.');
            return;
          }

          set((state) => {
            const nextNumber =
              state.teams.length > 0
                ? Math.max(...state.teams.map((t) => t.teamNumber)) + 1
                : 1;

            const newTeam: TournamentTeam = {
              id: `team-${crypto.randomUUID().slice(0, 8)}`,
              teamNumber: teamData.teamNumber ?? nextNumber,
              player1: teamData.player1.trim(),
              player2: teamData.player2?.trim() || '',
              alias: teamData.alias?.trim() || undefined,
              group: teamData.group,
            };

            return {
              teams: [...state.teams, newTeam],
            };
          });
          triggerBackgroundSync();
        },

        removeTeam: (teamId) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot remove teams after matches have started.');
            return;
          }

          set((state) => {
            const updatedTeams = state.teams.filter((t) => t.id !== teamId);
            return {
              teams: updatedTeams,
            };
          });
          triggerBackgroundSync();
        },

        loadSampleRoster: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot replace roster after matches have started.');
            return;
          }

          set({
            teams: [...SEEDED_TOURNAMENT_TEAMS],
          });
          triggerBackgroundSync();
        },

        clearAllTeams: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot clear teams after matches have started.');
            return;
          }

          set({
            teams: [],
            matches: [],
          });
          triggerBackgroundSync();
        },

        generateFixtures: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot regenerate fixtures after matches have started.');
            return;
          }

          const { config, teams, courts } = get();
          const newMatches = generateTournamentMatches(config.format, teams, courts);
          set({
            matches: newMatches,
          });
          triggerBackgroundSync();
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setSelectedGroupFilter: (group) => set({ selectedGroupFilter: group }),
        setSelectedStageFilter: (stage) => set({ selectedStageFilter: stage }),
        setSelectedCourtFilter: (court) => set({ selectedCourtFilter: court }),

        addCourt: (courtName) => {
          const trimmed = courtName.trim();
          if (!trimmed) return;
          const { courts, settings } = get();
          if (!courts.includes(trimmed)) {
            set({
              courts: [...courts, trimmed],
              settings: {
                ...settings,
                courts: [...settings.courts, trimmed],
              },
            });
            triggerBackgroundSync();
          }
        },

        removeCourt: (courtName) => {
          set((state) => ({
            courts: state.courts.filter((c) => c !== courtName),
            settings: {
              ...state.settings,
              courts: state.settings.courts.filter((c) => c !== courtName),
            },
          }));
          triggerBackgroundSync();
        },

        assignMatchCourt: (matchId, courtName) => {
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId ? { ...m, courtName: courtName.trim() || undefined } : m
            ),
          }));
          triggerBackgroundSync();
        },

        autoAssignCourts: () => {
          const { courts, matches } = get();
          const targetCourts = courts && courts.length > 0 ? courts : DEFAULT_EBC_SETTINGS.courts;
          set({
            matches: matches.map((m, idx) => ({
              ...m,
              courtName: m.courtName || targetCourts[idx % targetCourts.length],
            })),
          });
          triggerBackgroundSync();
        },

        startMatch: (matchId) => {
          set((state) => {
            const targetIndex = state.matches.findIndex((m) => m.id === matchId);
            if (targetIndex === -1) return state;
            const target = state.matches[targetIndex];

            // 1. Identify which courts are currently in play by OTHER live matches
            const liveCourts = new Set(
              state.matches
                .filter((m) => m.status === 'IN_PROGRESS' && m.id !== matchId && m.courtName)
                .map((m) => m.courtName)
            );

            // 2. Concurrency limit: Do not start more live matches than total arena courts!
            const currentLiveCount = state.matches.filter(
              (m) => m.status === 'IN_PROGRESS' && m.id !== matchId
            ).length;

            if (currentLiveCount >= state.courts.length) {
              console.warn(
                `Cannot start match: all ${state.courts.length} courts currently have active matches in progress.`
              );
              return state;
            }

            // 3. Dedicated court check:
            // If the match is assigned to a specific court that is already live, block starting!
            if (target.courtName && liveCourts.has(target.courtName)) {
              console.warn(
                `Cannot start match on ${target.courtName}: court already has a match in progress.`
              );
              return state;
            }

            // 4. If no court was assigned, pick the first AVAILABLE court
            const chosenCourt =
              target.courtName || state.courts.find((c) => !liveCourts.has(c));

            if (!chosenCourt || liveCourts.has(chosenCourt)) {
              console.warn('Cannot start match: no courts currently available.');
              return state;
            }

            return {
              matches: state.matches.map((m) =>
                m.id === matchId
                  ? {
                      ...m,
                      status: 'IN_PROGRESS',
                      courtName: chosenCourt,
                      startTime: m.startTime || Date.now(),
                    }
                  : m
              ),
            };
          });
          triggerBackgroundSync();
        },

        completeMatch: (matchId, scoreA, scoreB) => {
          set((state) => {
            const matchIndex = state.matches.findIndex((m) => m.id === matchId);
            if (matchIndex === -1) return state;

            const target = state.matches[matchIndex];
            const winnerTeamId = scoreA >= scoreB ? target.teamAId : target.teamBId;

            const updatedTarget: TournamentMatch = {
              ...target,
              status: 'COMPLETED',
              scoreA,
              scoreB,
              winnerTeamId,
              endTime: Date.now(),
            };

            const updatedMatches = [...state.matches];
            updatedMatches[matchIndex] = updatedTarget;

            // Auto-advance winners in knockouts if tournament has knockout stages
            let fullySyncedMatches = updatedMatches;
            if (
              state.config.format === 'GROUP_KNOCKOUT' ||
              state.config.format === 'KNOCKOUT'
            ) {
              fullySyncedMatches = syncKnockoutTree(updatedMatches, state.teams);
            }

            return {
              matches: fullySyncedMatches,
            };
          });
          triggerBackgroundSync();
        },

        editMatchScore: (matchId, scoreA, scoreB) => {
          set((state) => {
            const matchIndex = state.matches.findIndex((m) => m.id === matchId);
            if (matchIndex === -1) return state;

            const target = state.matches[matchIndex];
            const winnerTeamId = scoreA >= scoreB ? target.teamAId : target.teamBId;

            const updatedTarget: TournamentMatch = {
              ...target,
              status: 'COMPLETED',
              scoreA,
              scoreB,
              winnerTeamId,
            };

            const updatedMatches = [...state.matches];
            updatedMatches[matchIndex] = updatedTarget;

            let fullySyncedMatches = updatedMatches;
            if (
              state.config.format === 'GROUP_KNOCKOUT' ||
              state.config.format === 'KNOCKOUT'
            ) {
              fullySyncedMatches = syncKnockoutTree(updatedMatches, state.teams);
            }

            return {
              matches: fullySyncedMatches,
            };
          });
          triggerBackgroundSync();
        },

        awardWalkover: (matchId, winningTeamId) => {
          set((state) => {
            const matchIndex = state.matches.findIndex((m) => m.id === matchId);
            if (matchIndex === -1) return state;

            const target = state.matches[matchIndex];
            const isTeamAWinner = winningTeamId === target.teamAId;
            const targetPoints = state.config.pointsFormat || 21;

            const updatedTarget: TournamentMatch = {
              ...target,
              status: 'COMPLETED',
              scoreA: isTeamAWinner ? targetPoints : 0,
              scoreB: isTeamAWinner ? 0 : targetPoints,
              winnerTeamId: winningTeamId,
              endTime: Date.now(),
            };

            const updatedMatches = [...state.matches];
            updatedMatches[matchIndex] = updatedTarget;

            let fullySyncedMatches = updatedMatches;
            if (
              state.config.format === 'GROUP_KNOCKOUT' ||
              state.config.format === 'KNOCKOUT'
            ) {
              fullySyncedMatches = syncKnockoutTree(updatedMatches, state.teams);
            }

            return {
              matches: fullySyncedMatches,
            };
          });
          triggerBackgroundSync();
        },

        updateTeamName: (teamId, newPlayer1, newPlayer2, newAlias, newGroup) => {
          set((state) => {
            const updatedTeams = state.teams.map((t) => {
              if (t.id === teamId) {
                return {
                  ...t,
                  player1: newPlayer1.trim() || t.player1,
                  player2: newPlayer2.trim() || t.player2,
                  alias: newAlias?.trim() || undefined,
                  group: newGroup !== undefined ? newGroup : t.group,
                };
              }
              return t;
            });

            // Resync knockout names / standings
            let fullySyncedMatches = state.matches;
            if (state.config.format === 'GROUP_KNOCKOUT') {
              fullySyncedMatches = syncKnockoutTree(state.matches, updatedTeams);
            }

            return {
              teams: updatedTeams,
              matches: fullySyncedMatches,
            };
          });
          triggerBackgroundSync();
        },

        resetTournament: () => {
          const freshData = createInitialTournamentData();
          set({
            tournamentId: freshData.tournamentId,
            config: freshData.config,
            settings: freshData.settings,
            teams: freshData.teams,
            matches: freshData.matches,
            courts: freshData.courts,
            syncStatus: 'SYNCED',
            selectedGroupFilter: 'ALL',
            selectedStageFilter: 'ALL',
            selectedCourtFilter: 'ALL',
            activeTab: 'FIXTURES',
          });
          triggerBackgroundSync();
        },
      };
    },
    {
      name: 'equiplay-tournament-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Auto-migration: If any matches loaded from localStorage lack court assignments,
        // automatically backfill them across the configured arena courts.
        const targetCourts =
          state.courts && state.courts.length > 0
            ? state.courts
            : DEFAULT_EBC_SETTINGS.courts;
        const hasUnassigned = state.matches.some((m) => !m.courtName);
        if (hasUnassigned) {
          state.matches = state.matches.map((m, idx) => ({
            ...m,
            courtName: m.courtName || targetCourts[idx % targetCourts.length],
          }));
        }
      },
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        const memoryStorage = new Map<string, string>();
        return {
          getItem: (key: string) => memoryStorage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memoryStorage.set(key, value);
          },
          removeItem: (key: string) => {
            memoryStorage.delete(key);
          },
        };
      }),
    }
  )
);
