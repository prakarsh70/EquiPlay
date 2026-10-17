import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatTimeRemaining } from '../../utils/time';
import { playBuzzerSound } from '../../utils/sound';

interface CountdownTimerProps {
  sessionStartTime: number | null;
  bookingDurationMinutes: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  sessionStartTime,
  bookingDurationMinutes,
}) => {
  const calculateRemaining = () => {
    if (!sessionStartTime) return 0;
    const endTime = sessionStartTime + bookingDurationMinutes * 60 * 1000;
    return Math.max(0, endTime - Date.now());
  };

  const [msRemaining, setMsRemaining] = useState<number>(calculateRemaining);
  const buzzedRef = useRef(false);

  useEffect(() => {
    if (!sessionStartTime) return;

    // Reset buzzer if session just started
    buzzedRef.current = false;

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setMsRemaining(remaining);

      // Play buzzer once when expired
      if (remaining <= 0 && !buzzedRef.current) {
        buzzedRef.current = true;
        playBuzzerSound();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, bookingDurationMinutes]);

  if (!sessionStartTime) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm font-mono">
        <Clock className="w-4 h-4 text-slate-500" />
        <span>00:00</span>
      </div>
    );
  }

  const { formatted, isUrgent, isExpired } = formatTimeRemaining(msRemaining);

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-colors select-none font-mono ${
        isExpired
          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
          : isUrgent
            ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
            : 'bg-slate-900 border-slate-800 text-emerald-400'
      }`}
      aria-label={`Session time remaining: ${formatted}`}
    >
      {isUrgent || isExpired ? (
        <AlertTriangle className="w-4 h-4 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span className="text-base font-bold tracking-wider">{formatted}</span>
    </div>
  );
};

