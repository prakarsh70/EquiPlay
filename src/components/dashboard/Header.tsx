import React from 'react';
import { Flag, RotateCcw } from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { CountdownTimer } from '../common/CountdownTimer';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onOpenEndSessionConfirm: () => void;
  onOpenResetConfirm: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEndSessionConfirm,
  onOpenResetConfirm,
}) => {
  const { config } = useMatchStore();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Format */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tight text-slate-100">
              Equi<span className="text-emerald-400">Play</span>
            </span>
          </div>
          <Badge variant="emerald" className="hidden sm:inline-flex font-mono">
            {config.pointFormat} Pts
          </Badge>
        </div>

        {/* Live Isolated Countdown Timer */}
        <div className="flex items-center gap-2">
          <CountdownTimer
            sessionStartTime={config.sessionStartTime}
            bookingDurationMinutes={config.bookingDurationMinutes}
          />
        </div>

        {/* Actions: Prominent End Session & Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* End Session Button with Hover Tooltip */}
          <div className="relative group flex items-center">
            <button
              type="button"
              onClick={onOpenEndSessionConfirm}
              aria-label="End session and view final summary"
              title="End Session: Conclude today's games and view final leaderboard & MVP awards"
              className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border border-rose-500/40 shadow-sm shadow-rose-950/20 active:scale-95 cursor-pointer"
            >
              <Flag className="w-4 h-4 text-rose-400 shrink-0" />
              <span>End Session</span>
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <div className="w-2 h-2 bg-slate-800 rotate-45 -mb-1 border-t border-l border-slate-700" />
              <span className="px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg shadow-xl whitespace-nowrap">
                End Session &amp; View Summary
              </span>
            </div>
          </div>

          {/* Reset Session Icon with Hover Tooltip */}
          <div className="relative group flex items-center">
            <button
              type="button"
              onClick={onOpenResetConfirm}
              aria-label="Reset session"
              title="Reset Session: Clear all matches and start fresh"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 right-0 hidden group-hover:flex flex-col items-end pointer-events-none z-50">
              <div className="w-2 h-2 bg-slate-800 rotate-45 -mb-1 border-t border-l border-slate-700 mr-3" />
              <span className="px-2.5 py-1 text-[11px] font-medium text-rose-300 bg-slate-800 border border-slate-700 rounded-lg shadow-xl whitespace-nowrap">
                Reset All Matches
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
