import React, { useState } from 'react';
import { Check, X, Shield, Plus } from 'lucide-react';
import { TournamentSettings } from '../../types/tournament';
import { Modal } from '../common/Modal';

interface TournamentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TournamentSettings;
  onSave: (updated: Partial<TournamentSettings>) => void;
}

export const TournamentSettingsModal: React.FC<TournamentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [tournamentName, setTournamentName] = useState(settings.tournamentName);
  const [venueName, setVenueName] = useState(settings.venueName);
  const [targetPoints, setTargetPoints] = useState(
    settings.groupStageFormat.targetPoints
  );
  const [pointsPerWin, setPointsPerWin] = useState(
    settings.groupStageFormat.pointsPerWin
  );
  const [pointsPerLoss, setPointsPerLoss] = useState(
    settings.groupStageFormat.pointsPerLoss
  );
  const [knockoutPoints, setKnockoutPoints] = useState(
    settings.knockoutStageFormat.targetPoints
  );
  const [courts, setCourts] = useState<string[]>([...settings.courts]);
  const [newCourtInput, setNewCourtInput] = useState('');
  const [tieBreakers] = useState<
    ('POINTS' | 'DIFF' | 'POINTS_FOR')[]
  >([...settings.standingsTieBreaker]);

  if (!isOpen) return null;

  const handleAddCourt = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCourtInput.trim();
    if (!trimmed || courts.includes(trimmed)) return;
    setCourts([...courts, trimmed]);
    setNewCourtInput('');
  };

  const handleRemoveCourt = (court: string) => {
    if (courts.length <= 1) return;
    setCourts(courts.filter((c) => c !== court));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tournamentName: tournamentName.trim(),
      venueName: venueName.trim(),
      courts,
      groupStageFormat: {
        sets: 1,
        targetPoints: Number(targetPoints),
        pointsPerWin: Number(pointsPerWin),
        pointsPerLoss: Number(pointsPerLoss),
      },
      knockoutStageFormat: {
        bestOfSets: 3,
        targetPoints: Number(knockoutPoints),
      },
      standingsTieBreaker: tieBreakers,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Tournament Rules & Defaults">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-200">
        {/* Name and Venue */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tournament Title
            </label>
            <input
              type="text"
              required
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Venue Name
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Shuttlers Zone, Wakad"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Group Stage Rules (EBC Defaults) */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Group Stage Match Rules (EBC Spec)
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Target Points
              </label>
              <input
                type="number"
                min={11}
                max={30}
                value={targetPoints}
                onChange={(e) => setTargetPoints(Number(e.target.value))}
                className="w-full min-h-[40px] px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Pts per Win
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={pointsPerWin}
                onChange={(e) => setPointsPerWin(Number(e.target.value))}
                className="w-full min-h-[40px] px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Pts per Loss
              </label>
              <input
                type="number"
                min={0}
                max={2}
                value={pointsPerLoss}
                onChange={(e) => setPointsPerLoss(Number(e.target.value))}
                className="w-full min-h-[40px] px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Knockout Stage Rules */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
            Knockout Stage Rules
          </h4>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Format: Best of 3 Sets</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Points per set:</span>
              <input
                type="number"
                min={11}
                max={30}
                value={knockoutPoints}
                onChange={(e) => setKnockoutPoints(Number(e.target.value))}
                className="w-16 min-h-[36px] px-2 text-center rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Courts Config */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Arena Courts ({courts.length})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {courts.map((court) => (
              <span
                key={court}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
              >
                <span>{court}</span>
                {courts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCourt(court)}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Add court (e.g., Court 6)..."
              value={newCourtInput}
              onChange={(e) => setNewCourtInput(e.target.value)}
              className="flex-1 min-h-[40px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={handleAddCourt}
              disabled={!newCourtInput.trim()}
              className="px-3 min-h-[40px] rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Tie-breaker Priority */}
        <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <label className="text-xs font-bold text-slate-400 block">
            Pool Tie-Breaker Ordering
          </label>
          <div className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-2">
            <span>1. Match Points</span>
            <span>&gt;</span>
            <span>2. Point Diff (PD)</span>
            <span>&gt;</span>
            <span>3. Points For (PF)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Adheres to the official tournament rule: head-to-head applies when two teams share the same points.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/30 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply Rules</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
