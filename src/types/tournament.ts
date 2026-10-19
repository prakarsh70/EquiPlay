export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type MatchStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

export type TournamentStage =
  | 'GROUP'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL';

export type TournamentFormat =
  | 'GROUP_KNOCKOUT'    // Pool stage + Championship Knockout
  | 'GROUP_CONSOLATION' // Pool stage + Cup (Top 2) & Plate (Bottom 2) Knockouts
  | 'ROUND_ROBIN'       // Pure round-robin league table
  | 'KNOCKOUT';         // Pure sudden-death knockout bracket

export type TournamentPointFormat = 11 | 15 | 21 | 30;

export interface TournamentConfig {
  name: string;
  format: TournamentFormat;
  pointsFormat: TournamentPointFormat;
  isDoubles: boolean;
  status: 'SETUP' | 'ACTIVE';
}

export interface TournamentTeam {
  id: string; // e.g. "team-1", "team-6"
  teamNumber: number;
  player1: string;
  player2: string;
  group?: GroupId;
  alias?: string; // Optional team name like "LM Warriors"
}

export interface TournamentMatch {
  id: string; // crypto.randomUUID()
  matchCode: string; // e.g. "G-A-1" (Group A Match 1) or "R16-1", "QF-1", "FINAL"
  stage: TournamentStage;
  group?: GroupId;
  courtName?: string;
  teamAId: string;
  teamBId: string;
  status: MatchStatus;
  scoreA?: number;
  scoreB?: number;
  winnerTeamId?: string;
  startTime?: number;
  endTime?: number;
}

export interface GroupStanding {
  teamId: string;
  teamNumber: number;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number; // pointsFor - pointsAgainst
  isQualified: boolean; // Top 2 in group
}

export type TournamentTab = 'FIXTURES' | 'STANDINGS' | 'BRACKET' | 'ROSTER';
