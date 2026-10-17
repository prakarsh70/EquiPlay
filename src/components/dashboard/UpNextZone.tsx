import React from 'react';
import { ArrowUpRight, Shuffle, PlayCircle, Edit3, UserCheck, Swords } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Button } from '../common/Button';

interface UpNextZoneProps {
  upcomingMatches: Match[];
  inProgressCourts: Set<string>;
  allCourts: string[];
  playersById: Map<string, SessionPlayer>;
  activePlayingPlayerIds?: Set<string>;
  onStartMatch: (matchId: string) => void;
  onReshuffle: (matchId: string) => void;
  onEditLineup: (match: Match) => void;
  onReassignCourt: (matchId: string, newCourtName: string) => void;
}

const UpNextCourtSvg: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-15"
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
      className="text-amber-400"
    />
    {/* Inner Singles Lines */}
    <line
      x1="20"
      y1="38"
      x2="480"
      y2="38"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      className="text-amber-400/50"
    />
    <line
      x1="20"
      y1="182"
      x2="480"
      y2="182"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      className="text-amber-400/50"
    />
    {/* Left Service Lines */}
    <line x1="90" y1="18" x2="90" y2="202" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60" />
    <line x1="170" y1="18" x2="170" y2="202" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60" />
    <line x1="20" y1="110" x2="170" y2="110" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60" />
    {/* Right Service Lines */}
    <line x1="410" y1="18" x2="410" y2="202" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60" />
    <line x1="330" y1="18" x2="330" y2="202" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60" />
    <line x1="330" y1="110" x2="480" y2="110" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60" />
    {/* Center Net Line Divider */}
    <line x1="250" y1="10" x2="250" y2="210" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="2 4" opacity="0.6" />
  </svg>
);

export const UpNextZone: React.FC<UpNextZoneProps> = ({
  upcomingMatches,
  inProgressCourts,
  allCourts,
  playersById,
  activePlayingPlayerIds = new Set(),
  onStartMatch,
  onReshuffle,
  onEditLineup,
  onReassignCourt,
}) => {
  if (upcomingMatches.length === 0) {
    return (
      <section className="space-y-3" aria-labelledby="up-next-heading">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-amber-400" />
          <h2 id="up-next-heading" className="text-lg font-black text-slate-100">
            Up Next Queue
          </h2>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          No matches queued. More active players needed on the bench to form a match.
        </div>
      </section>
    );
  }

  // Find all courts that are currently open (not in progress)
  const openCourts = allCourts.filter((c) => !inProgressCourts.has(c));

  // If 1 upcoming match: full width grid-cols-1! If 2 or more: 2 columns on desktop
  const gridColsClass = upcomingMatches.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';

  return (
    <section className="space-y-3.5" aria-labelledby="up-next-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-amber-400" />
          <h2 id="up-next-heading" className="text-lg font-black text-slate-100 tracking-tight">
            Up Next Queue
          </h2>
        </div>
        <span className="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Warm Up Now
        </span>
      </div>

      <div className={`grid ${gridColsClass} gap-4`}>
        {upcomingMatches.map((match) => {
          const isCourtOccupied = inProgressCourts.has(match.courtName);

          // Find alternative courts that are completely open right now
          const otherOpenCourts = openCourts.filter(
            (c) => c !== match.courtName && !upcomingMatches.some((m) => m.id !== match.id && m.courtName === c)
          );

          const playerA1 = playersById.get(match.teamA[0])?.name || 'Player';
          const playerA2 = playersById.get(match.teamA[1])?.name || 'Player';
          const playerB1 = playersById.get(match.teamB[0])?.name || 'Player';
          const playerB2 = playersById.get(match.teamB[1])?.name || 'Player';

          return (
            <div
              key={match.id}
              className={`relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-900 to-amber-950/30 border-2 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all shadow-xl shadow-black/30 ${
                match.isManualLineup ? 'border-sky-500/50' : 'border-amber-400/40'
              }`}
            >
              {/* Badminton Court Surface Markings */}
              <UpNextCourtSvg />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      match.isManualLineup ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                    } animate-pulse`}
                  />
                  <div>
                    <span className="text-lg font-black text-slate-100 block tracking-tight">
                      {match.courtName} (Next)
                    </span>
                    {match.isManualLineup && (
                      <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Manual Lineup
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditLineup(match)}
                    aria-label={`Manually edit lineup for ${match.courtName}`}
                    title="Edit/Swap players or change court"
                    className="min-h-[44px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors border border-slate-700 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReshuffle(match.id)}
                    aria-label={`Reshuffle pairing for ${match.courtName}`}
                    title="Reshuffle combinations"
                    className="min-h-[44px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1 transition-colors border border-slate-700 shadow-sm"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>

              {/* Court Surface & Net Display */}
              <div className="relative z-10 grid grid-cols-5 items-stretch gap-2 py-1">
                {/* Team A */}
                <div className="col-span-2 bg-slate-950/90 rounded-2xl p-3 sm:p-3.5 border border-amber-500/30 flex flex-col justify-center text-center shadow-lg shadow-black/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1.5">
                    Team A
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-100 truncate">{playerA1}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-100 truncate">{playerA2}</p>
                </div>

                {/* Center Net Divider */}
                <div className="col-span-1 flex flex-col items-center justify-center relative">
                  <div className="absolute inset-y-1 w-0.5 bg-gradient-to-b from-white/70 via-slate-400 to-white/70 opacity-60" />
                  <div className="relative z-10 w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-slate-300 shadow-xl">
                    <Swords className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="relative z-10 text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest bg-slate-950/90 px-1 rounded">
                    NET
                  </span>
                </div>

                {/* Team B */}
                <div className="col-span-2 bg-slate-950/90 rounded-2xl p-3 sm:p-3.5 border border-sky-500/30 flex flex-col justify-center text-center shadow-lg shadow-black/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-1.5">
                    Team B
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-100 truncate">{playerB1}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-100 truncate">{playerB2}</p>
                </div>
              </div>

              {/* Alternative open courts quick switch */}
              {otherOpenCourts.length > 0 && isCourtOccupied && (
                <div className="relative z-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium">
                    ⚡ {otherOpenCourts[0]} is free right now!
                  </span>
                  <button
                    type="button"
                    onClick={() => onReassignCourt(match.id, otherOpenCourts[0])}
                    className="font-bold text-emerald-400 hover:text-emerald-300 underline text-xs"
                  >
                    Move to {otherOpenCourts[0]}
                  </button>
                </div>
              )}

              {/* Start Match CTA */}
              {(() => {
                const matchPlayerIds = [...match.teamA, ...match.teamB];
                const hasPlayerPlaying = matchPlayerIds.some((id) =>
                  activePlayingPlayerIds.has(id)
                );
                const isDisabled = isCourtOccupied || hasPlayerPlaying;

                let buttonLabel = 'Put on Court & Start';
                if (isCourtOccupied) {
                  buttonLabel = `${match.courtName} Busy (Match in Progress)`;
                } else if (hasPlayerPlaying) {
                  buttonLabel = 'Players Playing on Another Court';
                }

                return (
                  <Button
                    variant={isDisabled ? 'outline' : 'primary'}
                    size="lg"
                    fullWidth
                    disabled={isDisabled}
                    onClick={() => onStartMatch(match.id)}
                    className="relative z-10 font-bold shadow-xl shadow-emerald-950/30 min-h-[48px] text-sm"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    {buttonLabel}
                  </Button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </section>
  );
};
