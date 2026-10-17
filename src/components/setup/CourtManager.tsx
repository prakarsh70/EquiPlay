import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';

export const CourtManager: React.FC = () => {
  const { config, addCourt, removeCourt } = useMatchStore();
  const [courtInput, setCourtInput] = useState('');

  const handleAddCourt = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = courtInput.trim();
    if (!trimmed) return;
    addCourt(trimmed);
    setCourtInput('');
  };

  const handleQuickAdd = () => {
    const nextNumber = config.courtNames.length + 1;
    addCourt(`Court ${nextNumber}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100">Courts Configuration</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Add arena courts reserved for this session
          </p>
        </div>
        <button
          type="button"
          onClick={handleQuickAdd}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 min-h-[48px] px-3 inline-flex items-center gap-1 focus:outline-none"
        >
          <Plus className="w-4 h-4" /> Quick Add Next
        </button>
      </div>

      {/* Court Badges */}
      <div className="flex flex-wrap gap-2">
        {config.courtNames.map((court) => (
          <div
            key={court}
            className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700/80 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-200"
          >
            <span>{court}</span>
            {config.courtNames.length > 1 && (
              <button
                type="button"
                onClick={() => removeCourt(court)}
                aria-label={`Remove ${court}`}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
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
          onChange={(e) => setCourtInput(e.target.value)}
          placeholder="e.g., Court 3 or Center Court"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[48px]"
        />
        <button
          type="submit"
          disabled={!courtInput.trim()}
          className="min-h-[48px] px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
    </div>
  );
};

