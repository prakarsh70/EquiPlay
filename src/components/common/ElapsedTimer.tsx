import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { formatDuration } from '../../utils/time';

interface ElapsedTimerProps {
  startTime?: number;
  endTime?: number;
}

export const ElapsedTimer: React.FC<ElapsedTimerProps> = ({ startTime, endTime }) => {
  const [elapsedText, setElapsedText] = useState(() => formatDuration(startTime, endTime));

  useEffect(() => {
    if (!startTime || endTime) {
      setElapsedText(formatDuration(startTime, endTime));
      return;
    }

    const interval = setInterval(() => {
      setElapsedText(formatDuration(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
      <Timer className="w-3.5 h-3.5" />
      <span>{elapsedText}</span>
    </div>
  );
};

