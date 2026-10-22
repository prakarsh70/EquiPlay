import React from 'react';
import {
  Users,
  Trophy,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Flame,
  Layers,
} from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { useTournamentStore } from '../../store/useTournamentStore';

interface ModeSelectorProps {
  onSelectMode: (mode: 'DAILY_PLAY' | 'TOURNAMENT') => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  // Phase 1 Daily store metrics
  const dailyPlayersCount = useMatchStore((s) => s.players.length);
  const dailyActiveMatches = useMatchStore(
    (s) => s.matches.filter((m) => m.status === 'IN_PROGRESS').length
  );
  const dailyCompletedMatches = useMatchStore(
    (s) => s.matches.filter((m) => m.status === 'COMPLETED').length
  );

  // Phase 2 Tournament store metrics
  const tournamentMatches = useTournamentStore((s) => s.matches);
  const completedGroupMatches = tournamentMatches.filter(
    (m) => m.stage === 'GROUP' && m.status === 'COMPLETED'
  ).length;
  const inProgressTournamentMatches = tournamentMatches.filter(
    (m) => m.status === 'IN_PROGRESS'
  ).length;
  const isFinalCompleted = tournamentMatches.some(
    (m) => m.stage === 'FINAL' && m.status === 'COMPLETED'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Branding */}
      <header className="max-w-4xl mx-auto w-full pt-4 sm:pt-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Courtside Kinetic PWA • Release v2.0.0</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-100 flex items-center justify-center gap-3">
          <span>Equi<span className="text-emerald-400">Play</span></span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
            v2.0.0
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Choose your arena mode. Whether you are running casual daily bench rotations
          or an intense 32-team championship bracket.
        </p>
      </header>

      {/* Mode Selection Cards */}
      <main className="max-w-4xl mx-auto w-full py-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* CARD A: Daily Court Rotation */}
        <button
          type="button"
          onClick={() => onSelectMode('DAILY_PLAY')}
          className="group relative flex flex-col justify-between text-left p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-950/30 transition-all duration-200 active:scale-[0.98] cursor-pointer min-h-[300px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <RefreshCw className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                Casual Play
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Daily Sessions
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
                Daily Court Rotation
              </h2>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Manage casual sessions, bench queues, snake-draft pairing, and fair
              wait-time tracking with dynamic on-court rotation.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0 flex-1 pr-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">
                {dailyPlayersCount > 0
                  ? `${dailyPlayersCount} players (${dailyActiveMatches} live, ${dailyCompletedMatches} done)`
                  : 'Ready to configure session'}
              </span>
            </div>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-colors ml-auto shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* CARD B: Tournament Arena */}
        <button
          type="button"
          onClick={() => onSelectMode('TOURNAMENT')}
          className="group relative flex flex-col justify-between text-left p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-amber-950/30 transition-all duration-200 active:scale-[0.98] cursor-pointer min-h-[300px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                <Trophy className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300">
                Championship Mode
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Championship
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
                Tournament Arena
              </h2>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Run pool stages, live points tables with head-to-head tie-breakers, and
              dynamic Round of 16 through Championship Finals for 32 seeded pairs.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0 flex-1 pr-2">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {isFinalCompleted
                  ? 'Champion Crowned!'
                  : `${completedGroupMatches}/48 Group Matches (${inProgressTournamentMatches} live)`}
              </span>
            </div>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-colors ml-auto shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </button>
      </main>

      {/* Footer Offline Notice */}
      <footer className="max-w-4xl mx-auto w-full pb-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
          <span>Independent local stores. Data stays safely cached in your browser.</span>
        </div>
      </footer>
    </div>
  );
};
