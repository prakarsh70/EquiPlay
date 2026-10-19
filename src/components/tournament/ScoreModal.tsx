import React, { useState, useEffect } from 'react';
import { Trophy, Minus, Plus, Check, Sparkles } from 'lucide-react';
import { TournamentMatch, TournamentTeam } from '../../types/tournament';
import { formatTeamName } from '../../utils/tournamentEngine';
import { Modal } from '../common/Modal';

interface ScoreModalProps {
  isOpen: boolean;
  match: TournamentMatch | null;
  teamA?: TournamentTeam;
  teamB?: TournamentTeam;
  onClose: () => void;
  onSave: (matchId: string, scoreA: number, scoreB: number) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  match,
  teamA,
  teamB,
  onClose,
  onSave,
}) => {
  const [targetScore, setTargetScore] = useState<number>(15);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);

  // Sync initial scores if editing an existing match
  useEffect(() => {
    if (match) {
      if (match.scoreA !== undefined && match.scoreB !== undefined) {
        setScoreA(match.scoreA);
        setScoreB(match.scoreB);
        // Infer target score from highest score if valid
        const maxScore = Math.max(match.scoreA, match.scoreB);
        if ([11, 15, 21, 30].includes(maxScore)) {
          setTargetScore(maxScore);
        }
      } else {
        setScoreA(0);
        setScoreB(0);
      }
    }
  }, [match]);

  if (!match) return null;

  const handleQuickWinA = () => {
    setScoreA(targetScore);
    // If scoreB is higher or equal to targetScore, set to a typical trailing score
    if (scoreB >= targetScore) {
      setScoreB(Math.max(0, targetScore - 4));
    }
  };

  const handleQuickWinB = () => {
    setScoreB(targetScore);
    if (scoreA >= targetScore) {
      setScoreA(Math.max(0, targetScore - 4));
    }
  };

  const adjustScoreA = (delta: number) => {
    setScoreA((prev) => Math.max(0, prev + delta));
  };

  const adjustScoreB = (delta: number) => {
    setScoreB((prev) => Math.max(0, prev + delta));
  };

  const canSave = scoreA !== scoreB; // Badminton matches cannot end in a draw

  const handleSave = () => {
    if (!canSave) return;
    onSave(match.id, scoreA, scoreB);
    onClose();
  };

  const teamAName = formatTeamName(teamA);
  const teamBName = formatTeamName(teamB);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Match Score • ${match.matchCode}`}
    >
      <div className="space-y-6">
        {/* Target Format Quick Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Target Game Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[11, 15, 21, 30].map((pts) => (
              <button
                key={pts}
                type="button"
                onClick={() => setTargetScore(pts)}
                className={`min-h-[48px] rounded-xl text-sm font-bold flex items-center justify-center transition-all cursor-pointer border ${
                  targetScore === pts
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {pts} Pts
              </button>
            ))}
          </div>
        </div>

        {/* Quick Win One-Tap Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleQuickWinA}
            className="min-h-[52px] p-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left transition-all cursor-pointer flex items-center justify-between group active:scale-95"
          >
            <div className="truncate pr-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Quick Win
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-100 group-hover:text-emerald-400 truncate block">
                {teamA ? `Team ${teamA.teamNumber}` : 'Team A'} Won
              </span>
            </div>
            <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleQuickWinB}
            className="min-h-[52px] p-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left transition-all cursor-pointer flex items-center justify-between group active:scale-95"
          >
            <div className="truncate pr-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Quick Win
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-100 group-hover:text-emerald-400 truncate block">
                {teamB ? `Team ${teamB.teamNumber}` : 'Team B'} Won
              </span>
            </div>
            <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
          </button>
        </div>

        {/* Courtside Kinetic Stepper Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team A Stepper Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              scoreA > scoreB
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                : 'bg-slate-800/50 border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wide">
                {teamA ? `Team ${teamA.teamNumber}` : 'Team A'}
              </span>
              {scoreA > scoreB && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Sparkles className="w-3 h-3" /> Leading
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-slate-200 truncate mb-3">
              {teamAName}
            </p>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => adjustScoreA(-1)}
                aria-label="Decrease score for Team A"
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              >
                <Minus className="w-6 h-6" />
              </button>

              <span className="text-4xl font-black font-mono text-slate-100 min-w-[60px] text-center">
                {scoreA}
              </span>

              <button
                type="button"
                onClick={() => adjustScoreA(1)}
                aria-label="Increase score for Team A"
                className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md shadow-emerald-950/30"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Team B Stepper Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              scoreB > scoreA
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                : 'bg-slate-800/50 border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wide">
                {teamB ? `Team ${teamB.teamNumber}` : 'Team B'}
              </span>
              {scoreB > scoreA && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Sparkles className="w-3 h-3" /> Leading
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-slate-200 truncate mb-3">
              {teamBName}
            </p>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => adjustScoreB(-1)}
                aria-label="Decrease score for Team B"
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              >
                <Minus className="w-6 h-6" />
              </button>

              <span className="text-4xl font-black font-mono text-slate-100 min-w-[60px] text-center">
                {scoreB}
              </span>

              <button
                type="button"
                onClick={() => adjustScoreB(1)}
                aria-label="Increase score for Team B"
                className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md shadow-emerald-950/30"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Draw Validation Note */}
        {!canSave && (
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs text-center font-bold">
            Matches cannot end in a draw. One team must win the match.
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-950/30 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Save Score
          </button>
        </div>
      </div>
    </Modal>
  );
};
