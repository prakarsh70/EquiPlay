# EquiPlay Phase 2: Tournament Arena & Championship Architecture

## 1. Architectural Strategy & Isolation

EquiPlay Phase 2 introduces **Tournament Mode** alongside **Phase 1 (Daily Court Rotation)** while strictly maintaining the **Zero Contamination** rule:

1. **Zero Contamination:**
   - Existing Phase 1 files (`src/store/useMatchStore.ts`, queue scheduling, snake draft, individual bench wait times) remain 100% untouched and functional.
   - Separate data types: `src/types/tournament.ts` vs `src/types/equiplay.ts`.
   - Separate stores: `useTournamentStore` vs `useMatchStore`.
2. **Independent State Persistence:**
   - Daily Session Store: persists to `localStorage` under key `'equiplay-session-storage'`.
   - Tournament Store: persists to `localStorage` under key `'equiplay-tournament-storage'`.
   - Active App Mode: persists under `'equiplay-active-app-mode'`.
3. **Root Hub View Switcher (`App.tsx`):**
   - Top-level router managing `type AppMode = 'HUB' | 'DAILY_PLAY' | 'TOURNAMENT'`.
   - Sleek landing Hub (`ModeSelector.tsx`) presenting two distinct cards:
     - **Card A: Daily Court Rotation** — Casual sessions, bench queues, dynamic pairings.
     - **Card B: Tournament Arena** — 32-team championship, pool stages, live points tables, knockout bracket.
   - Persistent `"← Switch Mode"` button accessible in both modes to return to the Hub at any moment.

---

## 2. Tournament Data Schemas (`src/types/tournament.ts`)

```typescript
export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type MatchStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

export type TournamentStage =
  | 'GROUP'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL';

export type TournamentFormat =
  | 'GROUP_KNOCKOUT' // Pool stage + Knockout bracket
  | 'ROUND_ROBIN'    // Pure round-robin league table
  | 'KNOCKOUT';      // Pure sudden-death knockout bracket

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
  alias?: string; // e.g. "LM Warriors"
}

export interface TournamentMatch {
  id: string; // crypto.randomUUID()
  matchCode: string; // e.g. "G-A-1", "R16-1", "QF-1", "FINAL"
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
```

---

## 3. Seeded 32-Team Roster

Pre-populated in `src/data/tournamentSeed.ts`:

- **GROUP A:**
  - Team 6: Chandan & Abhijeet
  - Team 11: Mayur & Srinivas
  - Team 14: Kartik & Shantanu
  - Team 27: Vasantha & Mani
- **GROUP B:**
  - Team 7: Meeta & Abhinav
  - Team 12: Ashish & Tarang
  - Team 23: Tanay & Rohit
  - Team 16: Sam & Pranit
- **GROUP C:**
  - Team 10: Sangram & Rahul *(LM Warriors)*
  - Team 13: Mohit & Rajat
  - Team 17: Akash & Prakash
  - Team 20: Ayush & Abhishek
- **GROUP D:**
  - Team 1: Brajesh & Sachin *(Tyrant-turtles)*
  - Team 21: Sandip & Abhijit
  - Team 25: Sarvanan & Kshitij
  - Team 29: Rajeev & Siddhant
- **GROUP E:**
  - Team 2: Ajay & Omkar *(OMAJination)*
  - Team 32: Shreenik & Ajit
  - Team 19: Bhusan & Sarang
  - Team 31: Akshay & Prakash
- **GROUP F:**
  - Team 3: Rajesh & Adarsh
  - Team 4: Mandar & Anurag
  - Team 18: Sandeep & Mahesh
  - Team 26: Sameer & Subhash
- **GROUP G:**
  - Team 15: Sunny & Somesh
  - Team 28: Arpit & Rajan
  - Team 30: Subham & Prathamesh
  - Team 22: Harsh & Shreyas
- **GROUP H:**
  - Team 5: Ketan & Swapnil
  - Team 8: Vaibhav & Abhimanyu *(Mighty Tigers)*
  - Team 9: Unmesh & Digvijay
  - Team 24: Manoj & Deepti

---

## 4. Mathematical Engine (`src/utils/tournamentEngine.ts`)

### 4.1 Group Fixtures Generator
Each 4-team pool `[T1, T2, T3, T4]` generates 6 matches in exact round-robin sequencing:
- Match 1: T1 vs T4 (`G-[group]-1`)
- Match 2: T2 vs T3 (`G-[group]-2`)
- Match 3: T1 vs T3 (`G-[group]-3`)
- Match 4: T4 vs T2 (`G-[group]-4`)
- Match 5: T1 vs T2 (`G-[group]-5`)
- Match 6: T3 vs T4 (`G-[group]-6`)
- **Total Group Stage Matches:** 8 groups × 6 = 48 matches.

### 4.2 Dynamic Standings & 4-Tier Tie-Breaker
Dynamically computed strictly on `status === 'COMPLETED'` matches.
1. **Total Wins (Descending)**
2. **Head-to-Head Result (if 2 teams are tied on wins):** Direct completed match winner ranks above the loser.
3. **Point Differential (`pointsFor - pointsAgainst`) (Descending)**
4. **Total Points For (Descending)**
5. **Team Number fallback (Ascending)**
- Top 2 teams marked `isQualified: true`.

### 4.3 Cross-Group Knockout Bracket Pairing
Cross-group Round-of-16 mapping:
- Match 1 (`R16-1`): 1st Group A vs 2nd Group B
- Match 2 (`R16-2`): 1st Group C vs 2nd Group D
- Match 3 (`R16-3`): 1st Group E vs 2nd Group F
- Match 4 (`R16-4`): 1st Group G vs 2nd Group H
- Match 5 (`R16-5`): 1st Group B vs 2nd Group A
- Match 6 (`R16-6`): 1st Group D vs 2nd Group C
- Match 7 (`R16-7`): 1st Group F vs 2nd Group E
- Match 8 (`R16-8`): 1st Group H vs 2nd Group G

**Quarterfinals:**
- `QF-1`: Winner R16-1 vs Winner R16-2
- `QF-2`: Winner R16-3 vs Winner R16-4
- `QF-3`: Winner R16-5 vs Winner R16-6
- `QF-4`: Winner R16-7 vs Winner R16-8

**Semifinals:**
- `SF-1`: Winner QF-1 vs Winner QF-2
- `SF-2`: Winner QF-3 vs Winner QF-4

**Championship Final:**
- `FINAL`: Winner SF-1 vs Winner SF-2

---

## 5. UI & Courtside Kinetic Design System

- **Background Canvas:** `bg-slate-950`
- **Cards & Surfaces:** `bg-slate-900` / `border-slate-800`
- **Accents:** Emerald (`bg-emerald-500`, `text-emerald-400`), Amber (`bg-amber-400`), Rose (`bg-rose-500`).
- **Minimum Touch Targets:** `48px x 48px` on all buttons and score steppers.
- **Courtside Score Logging Modal:**
  - Game format picker: 11, 15, 21, 30 pts.
  - Large Quick-Tap buttons: "Team A Won" / "Team B Won".
  - Large `+` and `-` steppers for trailing team scores.
  - Immediate non-draw validation.
- **Tournament Dashboard Layout:**
  - Header: Mode switcher, group & overall progress bar, court filter pills, reset action.
  - Tab 1: Fixtures & Live Scoring (filter by stage, group, status, court, or search query).
  - Tab 2: Standings & Tables (8-group tables with emerald top-2 highlights and tie-breaker guide).
  - Tab 3: Knockout Bracket (visual bracket tree from R16 to Final with Champion podium).
  - Tab 4: Teams / Roster (all 32 pairs with search and modal for swapping absent players or editing aliases).

---

## 6. Offline PWA & Zero-Dependency Guarantees

- Runs 100% locally in the browser with no backend or network dependencies.
- Fully cached precache assets via Vite PWA Workbox plugin.
- All actions persist reactively to `localStorage`.
