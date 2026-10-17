import React from 'react';
import { ArrowUpRight, Shuffle, PlayCircle, Edit3, UserCheck } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Button } from '../common/Button';

interface UpNextZoneProps {
  upcomingMatches: Match[];
  inProgressCourts: Set<string>;
  allCourts: string[];
  playersById: Map<string, SessionPlayer>;
  onStartMatch: (matchId: string) => void;
  onReshuffle: (matchId: string) => void;
  onEditLineup: (match: Match) => void;
  onReassignCourt: (matchId: string, newCourtName: string) => void;
}

export const UpNextZone: React.FC<UpNextZoneProps> = ({
  upcomingMatches,
  inProgressCourts,
  allCourts,
  playersById,
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

  return (
    <section className="space-y-3" aria-labelledby="up-next-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-amber-400" />
          <h2 id="up-next-heading" className="text-lg font-black text-slate-100">
            Up Next Queue
          </h2>
        </div>
        <span className="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Warm Up Now
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between ${
                match.isManualLineup ? 'border-sky-500/50' : 'border-amber-400/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      match.isManualLineup ? 'bg-sky-400' : 'bg-amber-400'
                    } animate-pulse`}
                  />
                  <div>
                    <span className="text-base font-black text-slate-100 block">
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
                    className="min-h-[44px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors border border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReshuffle(match.id)}
                    aria-label={`Reshuffle pairing for ${match.courtName}`}
                    title="Reshuffle combinations"
                    className="min-h-[44px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1 transition-colors border border-slate-700"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>

              {/* Roster Matchup */}
              <div className="grid grid-cols-5 items-center gap-2 py-1">
                {/* Team A */}
                <div className="col-span-2 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block mb-1">
                    Team A
                  </span>
                  <p className="text-xs font-bold text-slate-200 truncate">{playerA1}</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{playerA2}</p>
                </div>

                {/* VS */}
                <div className="col-span-1 text-center">
                  <span className="text-[11px] font-black text-slate-500 uppercase">VS</span>
                </div>

                {/* Team B */}
                <div className="col-span-2 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400/80 block mb-1">
                    Team B
                  </span>
                  <p className="text-xs font-bold text-slate-200 truncate">{playerB1}</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{playerB2}</p>
                </div>
              </div>

              {/* CTAs: If current court is occupied but another court is open, offer 1-tap reassign & play! */}
              {isCourtOccupied && otherOpenCourts.length > 0 ? (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      onReassignCourt(match.id, otherOpenCourts[0]);
                      // Start immediately on the open court
                      onStartMatch(match.id);
                    }}
                    className="font-bold bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/20"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Play on {otherOpenCourts[0]} Now (Open)
                  </Button>
                  <p className="text-[11px] text-center text-slate-400">
                    {otherOpenCourts[0]} is currently available for this match.
                  </p>
                </div>
              ) : (
                <Button
                  variant={isCourtOccupied ? 'secondary' : 'primary'}
                  size="md"
                  fullWidth
                  disabled={isCourtOccupied}
                  onClick={() => onStartMatch(match.id)}
                  className="font-bold"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {isCourtOccupied ? `Waiting for ${match.courtName} to Finish` : 'Put On Court'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
