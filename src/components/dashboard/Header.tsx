import React from 'react';
import { History, Flag, RotateCcw } from 'lucide-react';
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
  const { config, setView, matches } = useMatchStore();

  const completedCount = matches.filter((m) => m.status === 'COMPLETED').length;

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

        {/* Actions: End Session, History & Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* End Session Button */}
          <button
            type="button"
            onClick={onOpenEndSessionConfirm}
            aria-label="End session and view final summary"
            className="min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors border border-rose-500/30"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xs:inline">End Session</span>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setView('HISTORY')}
            aria-label="View match history and session summary"
            className="min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Log</span>
            {completedCount > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-1.5 py-0.5 rounded-full font-mono">
                {completedCount}
              </span>
            )}
          </button>

          {/* Reset Session Icon */}
          <button
            type="button"
            onClick={onOpenResetConfirm}
            aria-label="Reset session"
            title="Reset Session"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
