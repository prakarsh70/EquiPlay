import React from 'react';
import { Activity, Swords, UserPlus } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Button } from '../common/Button';
import { ElapsedTimer } from '../common/ElapsedTimer';

interface OnCourtZoneProps {
  courts: string[];
  inProgressMatches: Match[];
  playersById: Map<string, SessionPlayer>;
  onEndMatch: (match: Match) => void;
  onManualMatch: (courtName?: string) => void;
}

export const OnCourtZone: React.FC<OnCourtZoneProps> = ({
  courts,
  inProgressMatches,
  playersById,
  onEndMatch,
  onManualMatch,
}) => {
  return (
    <section className="space-y-3" aria-labelledby="on-court-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 id="on-court-heading" className="text-lg font-black text-slate-100">
            On Court Now
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {inProgressMatches.length} Active / {courts.length} Court{courts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courts.map((court) => {
          const match = inProgressMatches.find((m) => m.courtName === court);

          if (!match) {
            return (
              <div
                key={court}
                className="bg-slate-900/60 border border-dashed border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors min-h-[170px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    <span className="text-base font-bold text-slate-200">{court}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Open Court
                  </span>
                </div>

                <div className="py-2 text-center text-xs text-slate-400 font-medium">
                  Ready for match — choose 4 players to start
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => onManualMatch(court)}
                  className="font-bold shadow-md shadow-emerald-950/20 min-h-[44px]"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Put Players on {court}
                </Button>
              </div>
            );
          }

          const playerA1 = playersById.get(match.teamA[0])?.name || 'Player';
          const playerA2 = playersById.get(match.teamA[1])?.name || 'Player';
          const playerB1 = playersById.get(match.teamB[0])?.name || 'Player';
          const playerB2 = playersById.get(match.teamB[1])?.name || 'Player';

          return (
            <div
              key={match.id}
              className="bg-slate-900 border-2 border-emerald-500/30 shadow-lg shadow-emerald-950/20 rounded-2xl p-4 space-y-3 flex flex-col justify-between min-h-[170px]"
            >
              {/* Header: Court Name + Elapsed Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-base font-black text-slate-100">{court}</span>
                </div>
                <ElapsedTimer startTime={match.startTime} />
              </div>

              {/* Matchup: Team A vs Team B */}
              <div className="grid grid-cols-5 items-center gap-2 py-1">
                {/* Team A */}
                <div className="col-span-2 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                    Team A
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{playerA1}</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{playerA2}</p>
                </div>

                {/* VS Badge */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Swords className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 mt-0.5 uppercase">VS</span>
                </div>

                {/* Team B */}
                <div className="col-span-2 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block mb-0.5">
                    Team B
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{playerB1}</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{playerB2}</p>
                </div>
              </div>

              {/* End Match & Log Score CTA */}
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={() => onEndMatch(match)}
                className="font-bold shadow-md shadow-rose-950/20 min-h-[44px]"
              >
                End Match &amp; Log Score
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
