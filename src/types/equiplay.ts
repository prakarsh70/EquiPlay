export type PointFormat = 11 | 15 | 21;
export type MatchStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
export type SyncStatus = 'LOCAL' | 'PENDING' | 'SYNCED';

export interface Player {
  id: string; // crypto.randomUUID()
  name: string;
}

export interface SessionPlayer extends Player {
  isActive: boolean; // true = physically present; false = running late / resting
  gamesPlayedToday: number;
  consecutiveGamesSatOut: number;
  arrivalTime?: number; // Unix timestamp set the FIRST time isActive becomes true
  partnerId?: string; // ID of linked teammate/doubles partner
}

export interface SessionConfig {
  courtNames: string[]; // e.g., ["Court 3", "Court 4"]
  bookingDurationMinutes: number; // e.g., 60, 120
  pointFormat: PointFormat; // 11, 15, or 21
  sessionStartTime: number | null; // Unix timestamp when session starts
  sessionEndTime?: number | null; // Unix timestamp when session was ended
}

export interface Match {
  id: string; // crypto.randomUUID()
  courtName: string;
  teamA: [string, string]; // Tuple of 2 Player IDs
  teamB: [string, string]; // Tuple of 2 Player IDs
  status: MatchStatus;
  startTime?: number; // Unix timestamp when moved to IN_PROGRESS
  endTime?: number; // Unix timestamp when moved to COMPLETED
  scoreA?: number;
  scoreB?: number;
  syncStatus: SyncStatus; // Always initialize as 'LOCAL'
  isManualLineup?: boolean; // Flag if manually adjusted by coordinator
}

export type AppView = 'SETUP' | 'DASHBOARD' | 'HISTORY' | 'SUMMARY';

export interface SessionRecord {
  id: string;
  config: SessionConfig;
  players: SessionPlayer[];
  matches: Match[];
  endedAt: number;
}
