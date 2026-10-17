import React, { useState, useEffect } from 'react';
import { Trophy, Minus, Plus, Check } from 'lucide-react';
import { Match, PointFormat, SessionPlayer } from '../../types/equiplay';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { playSuccessSound } from '../../utils/sound';

interface ScoreModalProps {
  isOpen: boolean;
  match: Match | null;
  pointFormat: PointFormat;
  playersById: Map<string, SessionPlayer>;
  onClose: () => void;
  onSaveScore: (matchId: string, scoreA: number, scoreB: number) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  match,
  pointFormat,
  playersById,
  onClose,
  onSaveScore,
}) => {
  const [scoreA, setScoreA] = useState<number>(pointFormat);
  const [scoreB, setScoreB] = useState<number>(Math.max(0, pointFormat - 2));

  // Reset scores whenever match opens
  useEffect(() => {
    if (match) {
      setScoreA(pointFormat);
      setScoreB(Math.max(0, pointFormat - 2));
    }
  }, [match, pointFormat]);

  if (!match) return null;

  const playerA1 = playersById.get(match.teamA[0])?.name || 'Player 1';
  const playerA2 = playersById.get(match.teamA[1])?.name || 'Player 2';
  const playerB1 = playersById.get(match.teamB[0])?.name || 'Player 3';
  const playerB2 = playersById.get(match.teamB[1])?.name || 'Player 4';

  const handleSelectWinnerA = () => {
    setScoreA(pointFormat);
    if (scoreB >= pointFormat) {
      setScoreB(pointFormat - 2);
    }
  };

  const handleSelectWinnerB = () => {
    setScoreB(pointFormat);
    if (scoreA >= pointFormat) {
      setScoreA(pointFormat - 2);
    }
  };

  const handleSave = () => {
    playSuccessSound();
    onSaveScore(match.id, scoreA, scoreB);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`End Match: ${match.courtName}`}>
      <div className="space-y-6">
        <p className="text-xs text-slate-400">
          Quickly select the winning team or adjust scores using the + / - steppers.
        </p>

        {/* Quick Winner Auto-Fill Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSelectWinnerA}
            className={`p-3.5 rounded-xl border text-center font-bold text-sm min-h-[56px] transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
              scoreA > scoreB
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>Team A Won</span>
            </div>
            <span className="text-[11px] font-normal opacity-90 truncate max-w-full">
              {playerA1} & {playerA2}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSelectWinnerB}
            className={`p-3.5 rounded-xl border text-center font-bold text-sm min-h-[56px] transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
              scoreB > scoreA
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>Team B Won</span>
            </div>
            <span className="text-[11px] font-normal opacity-90 truncate max-w-full">
              {playerB1} & {playerB2}
            </span>
          </button>
        </div>

        {/* Score Adjuster Steppers */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          {/* Team A Stepper */}
          <div className="space-y-2 text-center">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block truncate">
              Team A
            </span>
            <div className="text-3xl font-black font-mono text-slate-100 py-1">
              {scoreA}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setScoreA((s) => Math.max(0, s - 1))}
                aria-label="Decrease Team A score"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg active:scale-90 transition-all border border-slate-700"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setScoreA((s) => s + 1)}
                aria-label="Increase Team A score"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg active:scale-90 transition-all border border-slate-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Team B Stepper */}
          <div className="space-y-2 text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block truncate">
              Team B
            </span>
            <div className="text-3xl font-black font-mono text-slate-100 py-1">
              {scoreB}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setScoreB((s) => Math.max(0, s - 1))}
                aria-label="Decrease Team B score"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg active:scale-90 transition-all border border-slate-700"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setScoreB((s) => s + 1)}
                aria-label="Increase Team B score"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg active:scale-90 transition-all border border-slate-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} fullWidth>
            <Check className="w-5 h-5 mr-1.5" /> Save Result
          </Button>
        </div>
      </div>
    </Modal>
  );
};

