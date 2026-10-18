# 🏸 EquiPlay

> **Intelligent Badminton Matchmaking & Court Rotation Engine (Offline-First PWA)**  
> Engineered to eliminate wait-time disputes, repeat matchups, and court-hogging in recreational sessions and club socials.

[![Live Demo](https://img.shields.io/badge/Demo-equi--play.vercel.app-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://equi-play.vercel.app/)
[![Tests](https://img.shields.io/badge/Tests-27%20Passing-emerald?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/prakarsh70/EquiPlay)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.3-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline--Ready-purple?style=for-the-badge&logo=pwa&logoColor=white)](https://equi-play.vercel.app/)

---

## ⚡ Live Demo

👉 **Try the live application:** [**https://equi-play.vercel.app/**](https://equi-play.vercel.app/)

*Installable as a Progressive Web App (PWA) on iOS, Android, and Desktop. Works 100% offline in sports halls and gym basements with zero cellular reception.*

---

## 💡 The Problem & The Solution

In social badminton sessions (8–24+ players across 1–4 courts), coordinators face a constant coordination nightmare:
1. **Inequitable Play Time:** People who are vocal get more court time, while quiet players stay on the bench.
2. **Repetitive Matchups:** Without algorithmic pairing, the same 4 players often end up playing together on the same court for the entire session.
3. **Late Arrivals & Walk-ins:** Manually restructuring a tournament bracket when players arrive 20 minutes late or leave early is chaotic.
4. **Physical Impossibility Bugs:** Manually tracking players often leads to accidental duplicate assignments (e.g., Player A assigned to Court 1 and Court 2 simultaneously).

**EquiPlay** is an intelligent, offline-first rotation engine that automates player selection, partner variety, opponent diversity, court rotation, and score logging with mathematical fairness guarantees.

---

## ✨ Key Features

- **⚖️ Fair Wait-Time Weighting:** Dynamically prioritizes players with the fewest games played, longest consecutive bench wait, and arrival order.
- **🔄 Combinatorial Shuffling:** Analyzes match co-occurrence and historical partner frequencies to maximize player variety and rotate players between different courts.
- **🛡️ Strict Physical Player Mutex:** Enforces physical constraints ($\lfloor \text{Active Players} / 4 \rfloor$). A player can **never** be assigned to or started on two courts simultaneously.
- **🤝 Doubles Partner Pairing:** Link two players as teammates (e.g. doubles tournament partners). They will always play together on the same side, while their opponents and courts dynamically rotate.
- **📋 ChatGPT-Style Projected Schedule & Match Log:** Real-time projected fixture table predicting upcoming rounds alongside a complete match history log and leaderboard.
- **🏸 Distinct Visual Metaphors:**
  - **On Court Now:** Authentic badminton court surface lines, net divider, and real-time game timers.
  - **Up Next Queue:** Tactical "VS" duel clash cards with dynamic crossed-rackets and shuttlecock trajectory illustrations.
- **📱 100% Offline-First PWA:** Zero external API or backend dependency. All session state is persisted locally in the browser with full service-worker caching.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph UI["Reactive UI Layer (React 19 + Tailwind v4)"]
        Dashboard["Dashboard View"]
        OnCourt["On-Court Zone (Live Timers)"]
        UpNext["Up-Next Queue (VS Clash Cards)"]
        Bench["Bench & Roster Zone"]
        Schedule["Schedule & Match History"]
    end

    subgraph Store["State Management (Zustand)"]
        State["useMatchStore"]
        Storage[("Browser LocalStorage / Persistence")]
        State <--> Storage
    end

    subgraph Engine["Core Matchmaker & Analytical Engine"]
        Matcher["generateNextMatches()"]
        Pairer["pairFourPlayers()"]
        History["buildHistoryMatrices()"]
        Projector["generateProjectedSchedule()"]
    end

    UI <--> State
    State --> Engine
    Engine --> State
```

---

## 🧠 The Matchmaking Algorithm

EquiPlay does not use static brackets or naive random shuffling. It runs an analytical optimization engine before every match:

### 1. Candidate Selection (Who Plays Next?)
Eligible bench players are ranked using a multi-variable sort:
$$\text{Rank Score} = (\text{Games Played Today}) \uparrow \longrightarrow (\text{Consecutive Games Sat Out}) \downarrow \longrightarrow (\text{Arrival Timestamp}) \uparrow$$
This guarantees that bench-sitters are prioritized immediately when a court opens.

### 2. Cross-Court Partitioning (Co-Occurrence Minimization)
When multiple courts queue up (e.g., 8 players across 2 courts), the engine evaluates candidate partitions:
$$\text{Cost}(G_1, G_2) = \sum_{(u, v) \in G_1} \text{coOccurrence}(u, v) + \sum_{(u, v) \in G_2} \text{coOccurrence}(u, v)$$
It selects the partition that minimizes repeat matchups, guaranteeing that players from Court 1 and Court 2 cross-pollinate.

### 3. Team Formation (Partner Repeat Minimization)
For any 4 drafted players, the engine evaluates all valid doubles configurations:
- **Combo 0:** $[P_0, P_3]$ vs $[P_1, P_2]$
- **Combo 1:** $[P_0, P_2]$ vs $[P_1, P_3]$
- **Combo 2:** $[P_0, P_1]$ vs $[P_2, P_3]$

$$\text{Team Penalty} = 10 \cdot (\text{PartnerRepeatCount}(T_A) + \text{PartnerRepeatCount}(T_B)) + \text{OpponentRepeatCount}$$
The combination with the lowest penalty is chosen, ensuring players rotate teammates every round.

### 4. Court Rotation (Balancing Court Exposure)
Matches are assigned to courts to prevent players from staying on the exact same physical court back-to-back:
$$\text{Court Cost}(m, c) = \sum_{p \in m} \left(2 \cdot \text{gamesOnCourt}(p, c) + 4 \cdot [\text{lastCourt}(p) == c]\right)$$

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Concurrent UI rendering and component architecture |
| **TypeScript 7** | End-to-end type safety, strict interface contracts |
| **Tailwind CSS v4** | Modern theme styling, utility-first UI design system |
| **Zustand** | Lightweight, high-performance global state machine |
| **Vitest** | Comprehensive unit & integration testing suite (27 passing tests) |
| **Vite 8** | Sub-millisecond HMR and optimized production bundling |
| **Vite PWA Plugin** | Service worker lifecycle, web app manifest, offline asset caching |
| **Lucide React** | Clean, accessible iconography |
| **Canvas Confetti** | Session completion celebration effects |
| **Vercel** | Edge deployment and continuous integration |

---

## 🚀 Developer Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/prakarsh70/EquiPlay.git
cd EquiPlay
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Run Test Suite
EquiPlay includes 27 comprehensive tests covering matchmaker algorithms, concurrency, court limits, and store transitions:
```bash
npm test
```

### 5. Build for Production
Compiles TypeScript and creates an optimized PWA bundle in `dist/`:
```bash
npm run build
```

### 6. Preview Production Build
```bash
npm run preview
```

---

## 🧪 Test Coverage Highlights

- `src/utils/ranking.test.ts`: Point differential, win-rate sorting, and tie-breakers.
- `src/utils/matchmaker.test.ts`:
  - Fair rotation priority (bench wait time vs games played).
  - Doubles partner link enforcement.
  - 8-player / 2-court dynamic team and court shuffling across consecutive rounds.
  - 4-player / 1-court partner rotation.
- `src/store/useMatchStore.test.ts`:
  - Player concurrency locks (zero player duplication across courts).
  - Physical court capacity cap: $\lfloor \text{Active Players} / 4 \rfloor$.
  - Walk-in queue auto-prioritization.
  - Inactive player purge and manual lineup validations.

---

## 🚀 Future Scope & Product Roadmap (Post-MVP)

While **Phase 1 (Local Offline MVP)** solves immediate courtside rotation and matchmaking using an offline-first architecture (`Zustand` + `localStorage`), **EquiPlay** is architected to scale into a full-featured, cloud-synced multi-sport platform.

### Phase 2: Offline-to-Cloud Synchronization & Multi-Device Live View
* **Zero-Data-Loss Cloud Migration:** Leverage the MVP's UUID entity generation (`crypto.randomUUID()`) and `syncStatus` state flag (`'LOCAL' | 'PENDING' | 'SYNCED'`) to batch-upload historical local matches to a **Firebase / Supabase** backend without ID collisions or lost session history.
* **Real-Time Multi-Device Sync:** Allow one player to host the session while the rest of the group scans a **Live Session QR Code** to view the "On Court" and "Up Next" queues updating in real time on their own phones.
* **Lightweight Group Authentication:** Introduce simple session passcodes or social sign-in so recurring groups can load their saved player rosters in one tap.

### Phase 3: Advanced Matchmaking Engine Upgrades
* **Dynamic Fixed-Team Overrides:** Allow players practicing for tournaments to lock in a fixed partner (`fixedTeams: [[PlayerA, PlayerB]]`) either at setup or mid-session, while still enforcing fair court-time rotation against the rest of the group.
* **Partnership & Opponent Variety Matrix:** Upgrade the core sorting algorithm into a multi-variable constraint solver that tracks a `partnershipMatrix` and `opponentMatrix`—penalizing repeated pairings so everyone plays *with* and *against* everyone equally when shuffling.
* **Dynamic Time-Capacity Feedback Loop ("Time-Panic Mode"):** Calculate a moving average of actual match durations (`endTime - startTime`) against the remaining booking clock. In the final 20 minutes of a court booking, automatically shift algorithmic weights from *Partnership Variety* to strict *Games Played Equity*—and suggest switching from 21-point to 15-point or 11-point formats if time is running tight.

### Phase 4: Historical Analytics & Gamification (`RTK Query` / `TanStack Query`)
* **Hybrid State Architecture:** Pair **Zustand** (for synchronous client/UI state) with **RTK Query / TanStack Query** (for server-state caching, background fetching, and optimistic updates).
* **Player Performance & Synergy Dashboards:** Derive lifetime, monthly, and weekly stats directly from immutable `Match` records—including Win/Loss ratios, Point Differentials, **Best Partner Synergy** (highest win rate together), and **Nemesis Tracking** (toughest opponents).
* **Attendance & Punctuality Leaderboards:** Utilize the `arrivalTime` timestamp logged when a player toggles from `Away` to `Active` to calculate court-time utilization and award playful community badges (e.g., the *"Always Late"* badge vs. *"Early Bird"*).
* **Court & Venue Insights:** Track historical win rates and match pacing across specific courts (e.g., *Court 3* vs. *Court 4*).

### Phase 5: Multi-Sport Expansion
* **Configurable Sport Presets:** Abstract the scoring and court-capacity rules (`playersPerCourt`, `pointFormat`) to support **Pickleball, Padel, Tennis, Table Tennis, and Half-Court Basketball**.

---

## 🤝 Contributing Workflow

We use a feature-branch workflow with Pull Requests:

1. **Fork or create a feature branch:**
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Make your changes and verify tests:**
   ```bash
   npm test
   npm run build
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "feat: add support for timed rounds"
   ```
4. **Push to GitHub and open a Pull Request:**
   ```bash
   git push origin feat/my-new-feature
   ```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<p align="center">
  Built with 🏸 by badminton players, for badminton players.
</p>

