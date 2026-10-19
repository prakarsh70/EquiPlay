import React, { useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';

export interface CourtSelectorProps {
  courts: string[];
  onAddCourt: (courtName: string) => void;
  onRemoveCourt: (courtName: string) => void;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  minCourts?: number;
}

export const CourtSelector: React.FC<CourtSelectorProps> = ({
  courts,
  onAddCourt,
  onRemoveCourt,
  title = 'Courts Configuration',
  subtitle = 'Add arena courts reserved for this tournament or session',
  disabled = false,
  minCourts = 1,
}) => {
  const [courtInput, setCourtInput] = useState('');

  const handleAddCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    const trimmed = courtInput.trim();
    if (!trimmed) return;
    onAddCourt(trimmed);
    setCourtInput('');
  };

  const handleQuickAdd = () => {
    if (disabled) return;
    const nextNumber = courts.length + 1;
    onAddCourt(`Court ${nextNumber}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={disabled}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Quick Add Next (+ Court {courts.length + 1})</span>
        </button>
      </div>

      {/* Court Badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {courts.map((court) => (
          <div
            key={court}
            className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-200 shadow-sm transition-all"
          >
            <span>{court}</span>
            {courts.length > minCourts && !disabled && (
              <button
                type="button"
                onClick={() => onRemoveCourt(court)}
                aria-label={`Remove ${court}`}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Custom Court Input */}
      <form onSubmit={handleAddCourt} className="flex gap-2 pt-1">
        <input
          type="text"
          value={courtInput}
          disabled={disabled}
          onChange={(e) => setCourtInput(e.target.value)}
          placeholder="e.g., Court 4 or Arena Center"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[48px] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !courtInput.trim()}
          className="min-h-[48px] px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};

