import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GroupId,
  TournamentConfig,
  TournamentFormat,
  TournamentMatch,
  TournamentPointFormat,
  TournamentStage,
  TournamentTab,
  TournamentTeam,
} from '../types/tournament';
import { SEEDED_TOURNAMENT_TEAMS } from '../data/tournamentSeed';
import {
  generateAllGroupMatches,
  generateInitialKnockoutMatches,
  generateTournamentMatches,
  syncKnockoutTree,
} from '../utils/tournamentEngine';

export interface TournamentStoreState {
  config: TournamentConfig;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  courts: string[];

  // Filter & Navigation State
  activeTab: TournamentTab;
  selectedGroupFilter: GroupId | 'ALL';
  selectedStageFilter: TournamentStage | 'ALL';
  selectedCourtFilter: string; // 'ALL' or specific court name

  // Config & Tournament Setup Actions
  hasMatchesStarted: () => boolean;
  setConfig: (updates: Partial<TournamentConfig>) => void;
  setTournamentFormat: (format: TournamentFormat) => void;
  setPointsFormat: (points: TournamentPointFormat) => void;
  startTournament: () => void;
  returnToSetup: () => void;

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
  startMatch: (matchId: string) => void;
  completeMatch: (matchId: string, scoreA: number, scoreB: number) => void;
  editMatchScore: (matchId: string, scoreA: number, scoreB: number) => void;

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

const DEFAULT_COURTS = ['Court 1', 'Court 2', 'Court 3'];

const DEFAULT_CONFIG: TournamentConfig = {
  name: 'EquiPlay Championship 2026',
  format: 'GROUP_KNOCKOUT',
  pointsFormat: 15,
  isDoubles: true,
  status: 'ACTIVE',
};

function createInitialTournamentData(): {
  config: TournamentConfig;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
} {
  const teams = [...SEEDED_TOURNAMENT_TEAMS];
  const groupMatches = generateAllGroupMatches(teams);
  const knockoutMatches = generateInitialKnockoutMatches();
  const allMatches = syncKnockoutTree([...groupMatches, ...knockoutMatches], teams);
  return { config: { ...DEFAULT_CONFIG }, teams, matches: allMatches };
}

export const useTournamentStore = create<TournamentStoreState>()(
  persist(
    (set, get) => {
      const initialData = createInitialTournamentData();

      return {
        config: initialData.config,
        teams: initialData.teams,
        matches: initialData.matches,
        courts: DEFAULT_COURTS,

        activeTab: 'FIXTURES',
        selectedGroupFilter: 'ALL',
        selectedStageFilter: 'ALL',
        selectedCourtFilter: 'ALL',

        // Helpers
        hasMatchesStarted: () => {
          return get().matches.some((m) => m.status !== 'UPCOMING');
        },

        // Config actions
        setConfig: (updates) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot change setup configuration after matches have started.');
            return;
          }
          set((state) => ({ config: { ...state.config, ...updates } }));
        },

        setTournamentFormat: (format) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot change tournament format after matches have started.');
            return;
          }
          set((state) => ({ config: { ...state.config, format } }));
        },

        setPointsFormat: (points) => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot change points format after matches have started.');
            return;
          }
          set((state) => ({ config: { ...state.config, pointsFormat: points } }));
        },

        startTournament: () => {
          const { config, teams } = get();
          const generatedMatches = generateTournamentMatches(config.format, teams);
          set((state) => ({
            config: { ...state.config, status: 'ACTIVE' },
            matches: generatedMatches,
            activeTab: 'FIXTURES',
          }));
        },

        returnToSetup: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot return to setup once matches have started. Reset tournament first.');
            return;
          }
          set((state) => ({
            config: { ...state.config, status: 'SETUP' },
          }));
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
        },

        loadSampleRoster: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot replace roster after matches have started.');
            return;
          }

          set({
            teams: [...SEEDED_TOURNAMENT_TEAMS],
          });
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
        },

        generateFixtures: () => {
          if (get().hasMatchesStarted()) {
            console.warn('Cannot regenerate fixtures after matches have started.');
            return;
          }

          const { config, teams } = get();
          const newMatches = generateTournamentMatches(config.format, teams);
          set({
            matches: newMatches,
          });
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setSelectedGroupFilter: (group) => set({ selectedGroupFilter: group }),
        setSelectedStageFilter: (stage) => set({ selectedStageFilter: stage }),
        setSelectedCourtFilter: (court) => set({ selectedCourtFilter: court }),

        addCourt: (courtName) => {
          const trimmed = courtName.trim();
          if (!trimmed) return;
          const { courts } = get();
          if (!courts.includes(trimmed)) {
            set({ courts: [...courts, trimmed] });
          }
        },

        removeCourt: (courtName) => {
          set((state) => ({
            courts: state.courts.filter((c) => c !== courtName),
          }));
        },

        assignMatchCourt: (matchId, courtName) => {
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId ? { ...m, courtName } : m
            ),
          }));
        },

        startMatch: (matchId) => {
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId
                ? {
                    ...m,
                    status: 'IN_PROGRESS',
                    startTime: m.startTime || Date.now(),
                  }
                : m
            ),
          }));
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
        },

        resetTournament: () => {
          const freshData = createInitialTournamentData();
          set({
            config: freshData.config,
            teams: freshData.teams,
            matches: freshData.matches,
            selectedGroupFilter: 'ALL',
            selectedStageFilter: 'ALL',
            selectedCourtFilter: 'ALL',
            activeTab: 'FIXTURES',
          });
        },
      };
    },
    {
      name: 'equiplay-tournament-storage',
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
