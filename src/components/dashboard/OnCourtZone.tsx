import React from 'react';
import { Activity, Swords, UserPlus, Trash2 } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Button } from '../common/Button';
import { ElapsedTimer } from '../common/ElapsedTimer';

interface OnCourtZoneProps {
  courts: string[];
  inProgressMatches: Match[];
  playersById: Map<string, SessionPlayer>;
  onEndMatch: (match: Match) => void;
  onCancelMatch?: (match: Match) => void;
  onManualMatch: (courtName?: string) => void;
}

/**
 * Authentic Badminton Court Line Markings SVG Overlay
 */
const BadmintonCourtSvg: React.FC<{ variant?: 'active' | 'open' }> = ({ variant = 'active' }) => (
  <svg
    className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity ${
      variant === 'active' ? 'opacity-25' : 'opacity-15'
    }`}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    viewBox="0 0 500 220"
  >
    {/* Outer Doubles Boundary Lines */}
    <rect
      x="20"
      y="18"
      width="460"
      height="184"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-emerald-400"
    />
    {/* Inner Singles Sidelines */}
    <line
      x1="20"
      y1="38"
      x2="480"
      y2="38"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      className="text-emerald-400/60"
    />
    <line
      x1="20"
      y1="182"
      x2="480"
      y2="182"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      className="text-emerald-400/60"
    />
    {/* Team A (Left) Service Lines */}
    <line
      x1="90"
      y1="18"
      x2="90"
      y2="202"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-emerald-400/70"
    />
    <line
      x1="170"
      y1="18"
      x2="170"
      y2="202"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-emerald-400/70"
    />
    <line
      x1="20"
      y1="110"
      x2="170"
      y2="110"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-emerald-400/70"
    />
    {/* Team B (Right) Service Lines */}
    <line
      x1="410"
      y1="18"
      x2="410"
      y2="202"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-emerald-400/70"
    />
    <line
      x1="330"
      y1="18"
      x2="330"
      y2="202"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-emerald-400/70"
    />
    <line
      x1="330"
      y1="110"
      x2="480"
      y2="110"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-emerald-400/70"
    />
    {/* Center Net Line Divider */}
    <line
      x1="250"
      y1="10"
      x2="250"
      y2="210"
      stroke="#ffffff"
      strokeWidth="3"
      strokeDasharray="2 4"
      opacity="0.8"
    />
  </svg>
);

export const OnCourtZone: React.FC<OnCourtZoneProps> = ({
  courts,
  inProgressMatches,
  playersById,
  onEndMatch,
  onCancelMatch,
  onManualMatch,
}) => {
  // If 1 court: full width grid-cols-1! If 2 or more: 2 columns on desktop
  const gridColsClass = courts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';

  // Calculate off-court bench players available
  const activePlayingIds = new Set<string>();
  inProgressMatches.forEach((m) => {
    m.teamA.forEach((id) => activePlayingIds.add(id));
    m.teamB.forEach((id) => activePlayingIds.add(id));
  });

  const activePlayers = Array.from(playersById.values()).filter((p) => p.isActive);
  const availableBenchCount = activePlayers.filter((p) => !activePlayingIds.has(p.id)).length;

  return (
    <section className="space-y-3.5" aria-labelledby="on-court-heading">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 id="on-court-heading" className="text-lg font-black text-slate-100 tracking-tight">
            On Court Now
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {inProgressMatches.length} Active / {courts.length} Court{courts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className={`grid ${gridColsClass} gap-4`}>
        {courts.map((court) => {
          const match = inProgressMatches.find((m) => m.courtName === court);

          if (!match) {
            const hasEnoughBench = availableBenchCount >= 4;

            return (
              <div
                key={court}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-slate-900/95 to-slate-950 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all shadow-xl shadow-black/40 group"
              >
                {/* Badminton Court Surface Markings */}
                <BadmintonCourtSvg variant="open" />

                {/* Court Card Header */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-slate-600 border border-slate-500" />
                    <span className="text-lg font-black text-slate-100 tracking-tight">
                      {court}
                    </span>
                  </div>
                  {hasEnoughBench ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Open Court</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Awaiting Bench ({availableBenchCount}/4)</span>
                    </span>
                  )}
                </div>

                {/* Simulated Court Interior with Net */}
                <div className="relative z-10 py-5 px-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4 text-center backdrop-blur-sm">
                  {/* Left Side (Team A Court) */}
                  <div className="flex-1 py-2 border-r border-dashed border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 block mb-1">
                      Side A
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {hasEnoughBench ? 'Awaiting Players' : `Need ${4 - availableBenchCount} more`}
                    </span>
                  </div>

                  {/* Net Divider */}
                  <div className="px-2 flex flex-col items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 text-sm shadow-md">
                      🏸
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-wider">
                      NET
                    </span>
                  </div>

                  {/* Right Side (Team B Court) */}
                  <div className="flex-1 py-2 border-l border-dashed border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400/80 block mb-1">
                      Side B
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {hasEnoughBench ? 'Awaiting Players' : `Need ${4 - availableBenchCount} more`}
                    </span>
                  </div>
                </div>

                {/* Direct Action: Put Players on Court */}
                <Button
                  variant={hasEnoughBench ? 'primary' : 'secondary'}
                  size="lg"
                  fullWidth
                  onClick={() => onManualMatch(court)}
                  className="relative z-10 font-bold shadow-lg shadow-emerald-950/40 min-h-[48px] text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {hasEnoughBench
                    ? `Put Players on ${court}`
                    : `Put Players on ${court} (${availableBenchCount}/4 off-court)`}
                </Button>
              </div>
            );
          }

          const playerA1 = playersById.get(match.teamA[0])?.name || 'Player 1';
          const playerA2 = playersById.get(match.teamA[1])?.name || 'Player 2';
          const playerB1 = playersById.get(match.teamB[0])?.name || 'Player 3';
          const playerB2 = playersById.get(match.teamB[1])?.name || 'Player 4';

          return (
            <div
              key={match.id}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-950/70 via-slate-900/95 to-sky-950/70 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/30 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all"
            >
              {/* Badminton Court Surface Markings */}
              <BadmintonCourtSvg variant="active" />

              {/* Header: Court Name + Live Elapsed Timer */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="text-lg font-black text-slate-100 tracking-tight">
                    {court}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                  <ElapsedTimer startTime={match.startTime} />
                </div>
              </div>

              {/* The Badminton Court Surface & Net Display */}
              <div className="relative z-10 grid grid-cols-5 items-stretch gap-2 py-1">
                {/* Left Court (Team A) */}
                <div className="col-span-2 bg-slate-950/90 rounded-2xl p-3 sm:p-3.5 border border-emerald-500/30 flex flex-col justify-center text-center shadow-lg shadow-black/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1.5">
                    Team A
                  </span>
                  <p className="text-sm sm:text-base font-black text-slate-100 truncate">
                    {playerA1}
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-100 truncate">
                    {playerA2}
                  </p>
                </div>

                {/* Center Badminton Net with Swords */}
                <div className="col-span-1 flex flex-col items-center justify-center relative">
                  {/* Vertical Net Post Line */}
                  <div className="absolute inset-y-1 w-0.5 bg-gradient-to-b from-white/80 via-slate-400 to-white/80 opacity-70" />

                  {/* Net Badge */}
                  <div className="relative z-10 w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-slate-300 shadow-xl">
                    <Swords className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="relative z-10 text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest bg-slate-950/90 px-1 rounded">
                    NET
                  </span>
                </div>

                {/* Right Court (Team B) */}
                <div className="col-span-2 bg-slate-950/90 rounded-2xl p-3 sm:p-3.5 border border-sky-500/30 flex flex-col justify-center text-center shadow-lg shadow-black/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-1.5">
                    Team B
                  </span>
                  <p className="text-sm sm:text-base font-black text-slate-100 truncate">
                    {playerB1}
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-100 truncate">
                    {playerB2}
                  </p>
                </div>
              </div>

              {/* End Match & Log Score CTA */}
              <div className="relative z-10 flex items-center gap-2">
                <Button
                  variant="danger"
                  size="lg"
                  fullWidth
                  onClick={() => onEndMatch(match)}
                  className="font-bold shadow-xl shadow-rose-950/30 min-h-[48px] text-sm flex-1"
                >
                  End Match &amp; Log Score
                </Button>
                {onCancelMatch && (
                  <button
                    type="button"
                    onClick={() => onCancelMatch(match)}
                    title="Cancel match & free court"
                    className="p-3 rounded-xl bg-slate-900/90 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center shrink-0 cursor-pointer"
                    aria-label={`Cancel match on ${court}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
