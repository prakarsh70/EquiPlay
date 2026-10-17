Markdown


# ROLE & OBJECTIVE
Act as a Principal Frontend Architect and UI/UX Designer. You are building **"EquiPlay"**, a mobile-first Progressive Web App (PWA) for Badminton Matchmaking, Court Rotation, and Session Management.

Your goal is to build a production-ready, zero-hallucination **Phase 1 (Local Offline MVP)** that strictly adheres to the data schemas, algorithmic logic, state transitions, and design language defined below.

---

# 1. PRODUCT ROADMAP & BOUNDARIES (CRITICAL)
We are using the "Context vs. Execution" pattern. Understand the future phases so you write scalable, decoupled code, but **ONLY execute Phase 1 right now**.

* **Phase 1 (CURRENT EXECUTION - Local MVP):** 100% offline-capable client application using React, TypeScript, Tailwind CSS, Lucide Icons, and Zustand (`persist` middleware saving to `localStorage` under key `'equiplay-session-storage'`).
* **Phase 2 (DO NOT BUILD YET - Cloud Sync):** Will integrate Firebase/Supabase to sync local records where `syncStatus === 'LOCAL'` to the cloud and allow live multi-device viewing via QR code.
* **Phase 3 (DO NOT BUILD YET - Analytics Engine & Multi-Sport):** Will use RTK Query / TanStack Query to aggregate historical win/loss ratios, partner synergy, "Always Late" arrival badges, and expand to Pickleball, Tennis, and Padel.

**STRICT ANTI-HALLUCINATION GUARDRAILS:**
1. **NO Backend/API Calls:** Do not import Firebase, Supabase, Axios, or `fetch`. Everything runs locally in the browser.
2. **NO Routing Libraries Needed:** Use a clean state-driven view switcher (`'SETUP' | 'DASHBOARD' | 'HISTORY'`) inside the main layout so the PWA works seamlessly without URL path issues.
3. **NO Mutating State Directly:** Always use immutable array operations (`map`, `filter`, `[...spread]`) inside Zustand actions.
4. **Use Native UUIDs:** Use `crypto.randomUUID()` for all `id` fields. Do not use `1, 2, 3` counters.

---

# 2. DESIGN LANGUAGE, UI/UX & ACCESSIBILITY ("Courtside Kinetic")
This app is used inside indoor badminton arenas where overhead lighting causes screen glare, and users are exhausted with sweaty hands between rallies.

* **Color Palette (High-Contrast Dark Mode Default):**
  * **Backgrounds:** Deep Arena Slate (`bg-slate-950` for main canvas, `bg-slate-900` for elevated cards, `border-slate-800` for subtle borders).
  * **Primary Accent (Court Turf Emerald):** `bg-emerald-500` (`text-slate-950` font for contrast) for primary actions ("Start Match", "Active" badges).
  * **Secondary Accent (Shuttlecock Volt/Amber):** `bg-amber-400` / `text-amber-400` for "Up Next" queue alerts and timer warnings.
  * **Danger / End Action:** `bg-rose-500` for "End Match" or destructive actions.
* **Ergonomics & Touch Targets:**
  * All interactive buttons, score steppers (`+` / `-`), and toggles MUST have a minimum touch target of `48px x 48px` (`min-h-[48px]`).
  * **NO tiny keyboard inputs for scores:** When logging match scores, provide quick tap buttons (e.g., tapping a team as the winner auto-fills their score to the target `pointFormat` like `15` or `21`, while allowing `+` / `-` buttons to adjust the loser's score easily).
* **Accessibility (WCAG 2.1 AA):**
  * Use semantic HTML (`<header>`, `<main>`, `<section>`, `<button>`, `<dialog>`).
  * Include `aria-label` on all icon-only buttons and `role="switch"` with `aria-checked` on the Player Active/Away toggle.
  * Never rely on color alone: pair green/gray status dots with explicit text labels (`"Active on Bench"`, `"On Court"`, `"Away / Late"`).

---

# 3. EXACT TYPESCRIPT DATA SCHEMA (`src/types/equiplay.ts`)
Use these exact interfaces. Do not remove any fields:

```typescript
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
}

export interface SessionConfig {
  courtNames: string[]; // e.g., ["Court 3", "Court 4"]
  bookingDurationMinutes: number; // e.g., 60, 120
  pointFormat: PointFormat; // 11, 15, or 21
  sessionStartTime: number | null; // Unix timestamp when session starts
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
}
4. CORE MATCHMAKING ALGORITHM (src/utils/matchmaker.ts)
Implement this exact pure function. Notice how it accepts busyPlayerIds (players currently in an IN_PROGRESS or UPCOMING match) so a player is never double-booked across two courts at the same time:

TypeScript


import { SessionPlayer } from '../types/equiplay';

export interface GeneratedPairing {
  teamA: [string, string];
  teamB: [string, string];
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

  // 2. Weighting Engine: Sort by fewest games played (ASC), then longest bench wait (DESC)
  const sortedPlayers = [...availablePlayers].sort((a, b) => {
    if (a.gamesPlayedToday !== b.gamesPlayedToday) {
      return a.gamesPlayedToday - b.gamesPlayedToday;
    }
    return b.consecutiveGamesSatOut - a.consecutiveGamesSatOut;
  });

  // 3. Slice 4 players per available court and Snake-Draft pair them (0 & 3 vs 1 & 2)
  const generatedMatches: GeneratedPairing[] = [];
  for (let i = 0; i < matchesToCreate; i++) {
    const selected = sortedPlayers.slice(i * 4, (i + 1) * 4);
    generatedMatches.push({
      teamA: [selected[0].id, selected[3].id],
      teamB: [selected[1].id, selected[2].id],
    });
  }

  return generatedMatches;
}
5. STATE MANAGEMENT & EXACT TRANSITION RULES (src/store/useMatchStore.ts)
Create a Zustand store wrapped in persist(..., { name: 'equiplay-session-storage' }). Implement these exact state rules:

addPlayer(name: string, isPresentNow: boolean):

Creates a SessionPlayer with gamesPlayedToday: 0, consecutiveGamesSatOut: 0, isActive: isPresentNow, and arrivalTime: isPresentNow ? Date.now() : undefined.

togglePlayerActive(playerId: string):

Flips isActive. If flipping from false to true and arrivalTime is undefined, stamp arrivalTime: Date.now().

Immediately trigger syncQueue() so if a court is waiting for players, the newly arrived player is queued into UPCOMING.

syncQueue() (Helper Action):

Checks how many courts do not currently have an UPCOMING match queued.

Finds all player IDs currently in IN_PROGRESS or UPCOMING matches (busyPlayerIds).

Calls generateNextMatches and creates UPCOMING match objects assigned to those open courts.

startMatch(matchId: string):

Ensures the target courtName does not already have an IN_PROGRESS match.

Changes the match status from 'UPCOMING' to 'IN_PROGRESS' and sets startTime: Date.now().

Calls syncQueue() to calculate the next 'UPCOMING' match in advance for the bench.

completeMatch(matchId: string, scoreA: number, scoreB: number):

Marks the match status: 'COMPLETED', sets endTime: Date.now(), scoreA, scoreB.

Let playedIds be the 4 player IDs from teamA and teamB.

Update all players in state:

If playedIds.includes(player.id): increment gamesPlayedToday + 1, and reset consecutiveGamesSatOut: 0.

Else if player.isActive === true: increment consecutiveGamesSatOut + 1.

Calls syncQueue() to keep the rotation moving.

resetSession():

Clears current session state (with a confirmation check) so a new day can begin.

6. UI VIEWS & COMPONENT SPECIFICATIONS
View 1: Setup View ("EquiPlay Setup")
Courts Configuration: Input field to add custom Court Names (e.g., "Court 3", "Court 4") as removable pill badges. Default to ["Court 1"].

Session Duration: Quick-select pill buttons (60m, 90m, 120m, 180m) plus a custom minute input.

Point Format: 3 large selectable cards for 11 pts, 15 pts, 21 pts (Default 15 pts).

Roster Builder: Input to type a player's name with an immediate toggle: "Here Now (Active)" vs "Running Late (Away)". Display added players in a clean list below.

Launch Button: Large emerald CTA "Start Session". Disabled until at least 1 court and 4 players are added. Clicking stamps sessionStartTime: Date.now(), runs syncQueue(), and opens the Dashboard.

View 2: Live Dashboard ("EquiPlay Live")
Sticky Top Header:

App Logo/Title "EquiPlay", badge showing target points (e.g., "15 Pts"), and a live Countdown Timer (MM:SS remaining based on sessionStartTime + bookingDurationMinutes).

Isolate the CountdownTimer into its own small child component so its 1-second setInterval only re-renders the timer text, not the entire dashboard!

Zone 1: "On Court Now" (IN_PROGRESS Matches):

Display one high-visibility card per court.

Show courtName, live elapsed match duration, and Team A (Player 1 & Player 2) vs Team B (Player 3 & Player 4).

Large "End Match & Log Score" button.

Zone 2: "Up Next Queue" (UPCOMING Matches):

Shows the pre-calculated next match for each court so players on the bench can warm up.

Includes a "Put On Court" button (enabled whenever that court has no IN_PROGRESS match) and a "Reshuffle" button.

Zone 3: "The Bench & Roster" (Player Drawer/Section):

Quick inline input at the top to add an unexpected walk-in player mid-session.

List of all players sorted by status (On Court, Up Next, Active on Bench, Away / Late).

Display each player's Games Played badge, Bench Wait (Sat Out) badge, and Arrival Time (formatted nicely like 7:14 PM).

Large accessible toggle switch to flip a player between Active and Away at any time.

View 3: Score Logging Modal & Match History Tab
Score Modal: Opens when "End Match & Log Score" is tapped.

Quick "Team A Won" / "Team B Won" buttons that auto-set the winning team's score to pointFormat (e.g., 15), plus large - / + stepper buttons to set the losing team's score in seconds.

Session Match Log Tab: A toggleable view showing all COMPLETED matches from today, displaying final scores, match duration (in minutes and seconds), and a "Session Summary" leaderboard showing Games Played and Wins today.

Please generate the complete, modular code starting with the types, the matchmaking utility, the Zustand store, and the clean React components.