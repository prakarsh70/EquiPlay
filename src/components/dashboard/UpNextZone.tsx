import React from 'react';
import { ArrowUpRight, Shuffle, PlayCircle, Edit3, UserCheck, Zap, Clock, Trash2 } from 'lucide-react';
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
  onDeleteMatch?: (matchId: string) => void;
}

/**
 * High-End Athletic "On-Deck Warm-Up & Fixtures" Background Illustration
 * Distinct from the on-court floor lines: features crossed rackets, flight trajectory arc,
 * dynamic shuttlecock, tactical radar rings, and diagonal velocity hatching.
 */
const UpNextBullpenSvg: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-20 transition-opacity duration-300 group-hover:opacity-30"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    viewBox="0 0 600 240"
  >
    <defs>
      {/* Velocity Diagonal Hatch Pattern */}
      <pattern
        id="warmup-stripes"
        width="24"
        height="24"
        patternTransform="rotate(45 0 0)"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.2"
          className="text-amber-400/20"
        />
      </pattern>

      {/* Badminton Racket String Mesh Pattern */}
      <pattern
        id="racket-string-mesh"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 6 0 L 0 0 0 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          className="text-amber-300/40"
        />
      </pattern>

      {/* Subtle Glow Gradient */}
      <linearGradient id="warmup-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
        <stop offset="50%" stopColor="#d97706" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
      </linearGradient>
    </defs>

    {/* Background Athletic Speed Grid */}
    <rect x="0" y="0" width="600" height="240" fill="url(#warmup-stripes)" />
    <rect x="0" y="0" width="600" height="240" fill="url(#warmup-gradient)" />

    {/* Tactical Radar Concentric Rings in Center */}
    <circle
      cx="300"
      cy="115"
      r="95"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="4 6"
      className="text-amber-400/25"
    />
    <circle
      cx="300"
      cy="115"
      r="60"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="5 5"
      className="text-amber-400/35"
    />
    <circle
      cx="300"
      cy="115"
      r="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-amber-400/45"
    />

    {/* Flight Trajectory of Shuttlecock (Dynamic Parabolic Arc) */}
    <path
      d="M 60 195 Q 300 25 540 185"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeDasharray="6 6"
      className="text-amber-400/60"
    />

    {/* Trajectory Velocity Particles */}
    <circle cx="170" cy="100" r="2.5" fill="currentColor" className="text-amber-300/60" />
    <circle cx="300" cy="65" r="3.5" fill="currentColor" className="text-amber-300" />
    <circle cx="430" cy="100" r="2.5" fill="currentColor" className="text-amber-300/60" />

    {/* Flying Shuttlecock Graphic (Apex of Flight Arc) */}
    <g transform="translate(300, 65) rotate(-12)">
      {/* Cork Head */}
      <ellipse cx="0" cy="-2" rx="7" ry="8" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
      {/* Feather Skirt */}
      <path
        d="M -6 3 L -17 30 L 17 30 L 6 3 Z"
        fill="#fef3c7"
        fillOpacity="0.2"
        stroke="#f59e0b"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Feather Spines */}
      <line x1="-11" y1="30" x2="-3" y2="4" stroke="#f59e0b" strokeWidth="0.9" opacity="0.8" />
      <line x1="0" y1="30" x2="0" y2="4" stroke="#f59e0b" strokeWidth="0.9" opacity="0.8" />
      <line x1="11" y1="30" x2="3" y2="4" stroke="#f59e0b" strokeWidth="0.9" opacity="0.8" />
      {/* Feather Ribbons / Binding Tape */}
      <line x1="-9" y1="16" x2="9" y2="16" stroke="#d97706" strokeWidth="1.2" />
      <line x1="-13" y1="24" x2="13" y2="24" stroke="#d97706" strokeWidth="1.2" />
    </g>

    {/* Left Crossed Badminton Racket Silhouette */}
    <g transform="translate(115, 120) rotate(-26)">
      {/* Racket Head Frame */}
      <ellipse
        cx="0"
        cy="-42"
        rx="38"
        ry="48"
        fill="url(#racket-string-mesh)"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-amber-400/50"
      />
      {/* Throat / Yoke */}
      <path
        d="M -11 6 L 0 20 L 11 6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-amber-400/60"
      />
      {/* Shaft */}
      <line
        x1="0"
        y1="20"
        x2="0"
        y2="90"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-amber-400/60"
      />
      {/* Grip / Handle */}
      <rect
        x="-5"
        y="90"
        width="10"
        height="44"
        rx="2"
        fill="currentColor"
        className="text-amber-500/70"
      />
    </g>

    {/* Right Crossed Badminton Racket Silhouette */}
    <g transform="translate(485, 120) rotate(26)">
      {/* Racket Head Frame */}
      <ellipse
        cx="0"
        cy="-42"
        rx="38"
        ry="48"
        fill="url(#racket-string-mesh)"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-sky-400/50"
      />
      {/* Throat / Yoke */}
      <path
        d="M -11 6 L 0 20 L 11 6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-sky-400/60"
      />
      {/* Shaft */}
      <line
        x1="0"
        y1="20"
        x2="0"
        y2="90"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-sky-400/60"
      />
      {/* Grip / Handle */}
      <rect
        x="-5"
        y="90"
        width="10"
        height="44"
        rx="2"
        fill="currentColor"
        className="text-sky-500/70"
      />
    </g>

    {/* Corner Tactical Target Brackets */}
    <path
      d="M 24 38 L 24 24 L 38 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="text-amber-400/40"
    />
    <path
      d="M 576 38 L 576 24 L 562 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="text-amber-400/40"
    />
    <path
      d="M 24 202 L 24 216 L 38 216"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="text-amber-400/40"
    />
    <path
      d="M 576 202 L 576 216 L 562 216"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="text-amber-400/40"
    />
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
  onDeleteMatch,
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
        <span className="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Warm Up Zone</span>
        </span>
      </div>

      <div className={`grid ${gridColsClass} gap-4`}>
        {upcomingMatches.map((match) => {
          const isCourtOccupied = inProgressCourts.has(match.courtName);

          // Find alternative courts that are completely open right now
          const otherOpenCourts = openCourts.filter(
            (c) =>
              c !== match.courtName &&
              !upcomingMatches.some((m) => m.id !== match.id && m.courtName === c)
          );

          const playerA1 = playersById.get(match.teamA[0])?.name || 'Player 1';
          const playerA2 = playersById.get(match.teamA[1])?.name || 'Player 2';
          const playerB1 = playersById.get(match.teamB[0])?.name || 'Player 3';
          const playerB2 = playersById.get(match.teamB[1])?.name || 'Player 4';

          const playerA1Obj = playersById.get(match.teamA[0]);
          const playerA2Obj = playersById.get(match.teamA[1]);
          const isTeamAPartnered =
            playerA1Obj && playerA2Obj && playerA1Obj.partnerId === playerA2Obj.id;

          const playerB1Obj = playersById.get(match.teamB[0]);
          const playerB2Obj = playersById.get(match.teamB[1]);
          const isTeamBPartnered =
            playerB1Obj && playerB2Obj && playerB1Obj.partnerId === playerB2Obj.id;

          return (
            <div
              key={match.id}
              className={`group relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-950 to-amber-950/20 border-2 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all shadow-xl shadow-black/40 hover:border-amber-400/60 ${
                match.isManualLineup ? 'border-sky-500/50' : 'border-amber-400/35'
              }`}
            >
              {/* Crossed Rackets & Flight Arc Vector Illustration */}
              <UpNextBullpenSvg />

              {/* Header: Scheduled Court + Lineup Controls */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      match.isManualLineup
                        ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                        : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                    } animate-pulse`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-100 block tracking-tight">
                        {match.courtName}
                      </span>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Next Up
                      </span>
                    </div>
                    {match.isManualLineup && (
                      <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1 mt-0.5">
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
                    className="min-h-[44px] px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReshuffle(match.id)}
                    aria-label={`Reshuffle pairing for ${match.courtName}`}
                    title="Reshuffle combinations"
                    className="min-h-[44px] px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>

                  {onDeleteMatch && (
                    <button
                      type="button"
                      onClick={() => onDeleteMatch(match.id)}
                      aria-label={`Discard upcoming match on ${match.courtName}`}
                      title="Discard upcoming match"
                      className="min-h-[44px] px-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-xs font-bold inline-flex items-center transition-colors border border-slate-700 hover:border-rose-500/30 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Head-to-Head Clash Layout (Distinct from Court Surface) */}
              <div className="relative z-10 grid grid-cols-5 items-stretch gap-2.5 py-1">
                {/* Team A Roster Box */}
                <div className="col-span-2 bg-slate-950/90 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-amber-500/30 flex flex-col justify-between shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Team A
                    </span>
                    {isTeamAPartnered && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                        Teammates
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 flex items-center justify-center shrink-0">
                        1
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-100 truncate">
                        {playerA1}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 flex items-center justify-center shrink-0">
                        2
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-100 truncate">
                        {playerA2}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center "VS" Matchup Emblem */}
                <div className="col-span-1 flex flex-col items-center justify-center relative">
                  {/* Subtle horizontal connector dots */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 border-t border-dashed border-amber-400/30" />

                  {/* Rotated Diamond VS Badge */}
                  <div className="relative z-10 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 via-slate-900 to-sky-500/25 border-2 border-amber-400/60 flex items-center justify-center shadow-xl shadow-black/50 rotate-45 group-hover:rotate-0 transition-transform duration-300">
                    <span className="-rotate-45 group-hover:rotate-0 transition-transform duration-300 text-xs font-black tracking-wider text-amber-300">
                      VS
                    </span>
                  </div>
                  <span className="relative z-10 text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800">
                    MATCHUP
                  </span>
                </div>

                {/* Team B Roster Box */}
                <div className="col-span-2 bg-slate-950/90 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-sky-500/30 flex flex-col justify-between shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-sky-400" />
                      Team B
                    </span>
                    {isTeamBPartnered && (
                      <span className="text-[9px] font-bold text-sky-300 bg-sky-400/20 px-1.5 py-0.2 rounded border border-sky-400/30">
                        Teammates
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] font-bold text-sky-300 flex items-center justify-center shrink-0">
                        3
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-100 truncate">
                        {playerB1}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] font-bold text-sky-300 flex items-center justify-center shrink-0">
                        4
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-100 truncate">
                        {playerB2}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative open courts quick switch */}
              {otherOpenCourts.length > 0 && isCourtOccupied && (
                <div className="relative z-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>⚡ {otherOpenCourts[0]} is free right now!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onReassignCourt(match.id, otherOpenCourts[0])}
                    className="font-bold text-emerald-400 hover:text-emerald-300 underline text-xs min-h-[36px] flex items-center"
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
