import React from 'react';
import { Clock } from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';

const QUICK_OPTIONS = [60, 90, 120, 180];

export const DurationPicker: React.FC = () => {
  const { config, setDuration } = useMatchStore();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-400" />
        <div>
          <h3 className="text-base font-bold text-slate-100">Session Duration</h3>
          <p className="text-xs text-slate-400">Total arena booking duration</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_OPTIONS.map((mins) => {
          const isSelected = config.bookingDurationMinutes === mins;
          return (
            <button
              key={mins}
              type="button"
              onClick={() => setDuration(mins)}
              className={`min-h-[48px] rounded-xl font-bold text-sm transition-all duration-150 border select-none ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/30'
                  : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300 border-slate-700'
              }`}
            >
              {mins / 60}h ({mins}m)
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <label htmlFor="custom-duration" className="text-xs font-medium text-slate-400 select-none">
          Custom (mins):
        </label>
        <input
          id="custom-duration"
          type="number"
          min={15}
          max={480}
          step={15}
          value={config.bookingDurationMinutes}
          onChange={(e) => setDuration(Number(e.target.value) || 60)}
          className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
        />
        <span className="text-xs text-slate-500">minutes</span>
      </div>
    </div>
  );
};

