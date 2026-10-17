import React from 'react';
import { Target } from 'lucide-react';
import { PointFormat } from '../../types/equiplay';
import { useMatchStore } from '../../store/useMatchStore';

const FORMATS: { format: PointFormat; title: string; desc: string }[] = [
  { format: 11, title: '11 Points', desc: 'Fast rotations & high turnover' },
  { format: 15, title: '15 Points', desc: 'Standard club recreational format' },
  { format: 21, title: '21 Points', desc: 'BWF standard full-length games' },
];

export const PointFormatSelector: React.FC = () => {
  const { config, setPointFormat } = useMatchStore();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-emerald-400" />
        <div>
          <h3 className="text-base font-bold text-slate-100">Point Format</h3>
          <p className="text-xs text-slate-400">Winning target points per match</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FORMATS.map(({ format, title, desc }) => {
          const isSelected = config.pointFormat === format;
          return (
            <button
              key={format}
              type="button"
              onClick={() => setPointFormat(format)}
              className={`p-4 rounded-xl border text-left transition-all duration-150 min-h-[72px] flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-lg font-black tracking-tight ${
                    isSelected ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {title}
                </span>
                <span
                  className={`w-3 h-3 rounded-full border-2 ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-400'
                      : 'border-slate-600 bg-transparent'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

