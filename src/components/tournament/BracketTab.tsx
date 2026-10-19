import React, { useState } from 'react';
import { Trophy, Crown, ChevronRight } from 'lucide-react';
import { TournamentMatch, TournamentStage } from '../../types/tournament';
import { useTournamentStore } from '../../store/useTournamentStore';
import {
  formatTeamName,
  getKnockoutSlotPlaceholder,
  getTournamentTeam,
} from '../../utils/tournamentEngine';

interface BracketTabProps {
  onOpenScoreModal: (match: TournamentMatch) => void;
}

const BRACKET_STAGES: Array<{ stage: TournamentStage; title: string; subtitle: string }> = [
  { stage: 'ROUND_OF_16', title: 'Round of 16', subtitle: '8 Matches' },
  { stage: 'QUARTER_FINAL', title: 'Quarter Finals', subtitle: '4 Matches' },
  { stage: 'SEMI_FINAL', title: 'Semi Finals', subtitle: '2 Matches' },
  { stage: 'FINAL', title: 'Grand Final', subtitle: 'Championship' },
];

export const BracketTab: React.FC<BracketTabProps> = ({ onOpenScoreModal }) => {
  const { matches, teams, config, setActiveTab } = useTournamentStore();
  const [activeStageView, setActiveStageView] = useState<TournamentStage | 'ALL'>('ALL');

  if (config.format === 'ROUND_ROBIN') {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-lg font-black text-slate-100">
          Pure Round Robin Format
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          In Round Robin league format, every team plays against each other and standings are decided on the live points table rather than a bracket.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('STANDINGS')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
        >
          <span>View Standings &amp; Points Table</span>
        </button>
      </div>
    );
  }

  const r16Matches = matches.filter((m) => m.stage === 'ROUND_OF_16');
  const qfMatches = matches.filter((m) => m.stage === 'QUARTER_FINAL');
  const sfMatches = matches.filter((m) => m.stage === 'SEMI_FINAL');
  const finalMatch = matches.find((m) => m.stage === 'FINAL');

  const finalWinnerTeam = finalMatch?.winnerTeamId
    ? getTournamentTeam(finalMatch.winnerTeamId, teams)
    : undefined;

  const renderMatchCard = (match: TournamentMatch) => {
    const teamA = getTournamentTeam(match.teamAId, teams);
    const teamB = getTournamentTeam(match.teamBId, teams);

    const teamAName = teamA
      ? formatTeamName(teamA)
      : getKnockoutSlotPlaceholder(match.matchCode, 'A');
    const teamBName = teamB
      ? formatTeamName(teamB)
      : getKnockoutSlotPlaceholder(match.matchCode, 'B');

    const isTeamAWinner =
      match.status === 'COMPLETED' && match.winnerTeamId === match.teamAId;
    const isTeamBWinner =
      match.status === 'COMPLETED' && match.winnerTeamId === match.teamBId;

    const canInteract = !!(match.teamAId && match.teamBId);

    return (
      <div
        key={match.id}
        onClick={() => {
          if (canInteract) {
            onOpenScoreModal(match);
          }
        }}
        className={`relative p-3 rounded-2xl bg-slate-900 border transition-all ${
          match.stage === 'FINAL'
            ? 'border-amber-400/60 shadow-xl shadow-amber-950/20 bg-slate-900/90'
            : 'border-slate-800'
        } ${
          canInteract
            ? 'hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer active:scale-[0.98]'
            : 'opacity-85'
        }`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between text-[11px] mb-2 pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-black text-slate-300">
              {match.matchCode}
            </span>
            {match.courtName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                {match.courtName}
              </span>
            )}
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              match.status === 'COMPLETED'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : match.status === 'IN_PROGRESS'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {match.status === 'COMPLETED'
              ? 'Final'
              : match.status === 'IN_PROGRESS'
              ? 'Live'
              : 'Upcoming'}
          </span>
        </div>

        {/* Team Slots */}
        <div className="space-y-1.5">
          {/* Team A Slot */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
              isTeamAWinner
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                : teamA
                ? 'bg-slate-950/70 border-slate-800/80 text-slate-200'
                : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500 italic'
            }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              {teamA && (
                <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-mono font-black text-slate-400 shrink-0">
                  {teamA.teamNumber}
                </span>
              )}
              <span className="truncate">{teamAName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 font-mono font-black">
              {isTeamAWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{match.scoreA !== undefined ? match.scoreA : '-'}</span>
            </div>
          </div>

          {/* Team B Slot */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
              isTeamBWinner
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                : teamB
                ? 'bg-slate-950/70 border-slate-800/80 text-slate-200'
                : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500 italic'
            }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              {teamB && (
                <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-mono font-black text-slate-400 shrink-0">
                  {teamB.teamNumber}
                </span>
              )}
              <span className="truncate">{teamBName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 font-mono font-black">
              {isTeamBWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{match.scoreB !== undefined ? match.scoreB : '-'}</span>
            </div>
          </div>
        </div>

        {/* Card Tap Tip if ready to score */}
        {canInteract && (
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-[10px] text-emerald-400 font-bold">
              Tap to {match.status === 'COMPLETED' ? 'Edit Score' : 'Log Score'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Champion Podium Spotlight (if final completed) */}
      {finalWinnerTeam && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/20 border-2 border-amber-400/50 p-6 sm:p-8 text-center space-y-3 shadow-2xl shadow-amber-950/40">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest animate-bounce">
            <Crown className="w-4 h-4 text-amber-400" />
            Tournament Champions
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Team {finalWinnerTeam.teamNumber} • {formatTeamName(finalWinnerTeam)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Victorious across 32 teams to lift the EquiPlay Championship Trophy!
          </p>
        </div>
      )}

      {/* Stage Selector for Mobile / Tabbed View */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:hidden bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveStageView('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            activeStageView === 'ALL'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          All Stages
        </button>
        {BRACKET_STAGES.map((s) => (
          <button
            key={s.stage}
            type="button"
            onClick={() => setActiveStageView(s.stage)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeStageView === s.stage
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Bracket Tree Columns Layout (Horizontal scroll on desktop or full responsive) */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[760px] grid grid-cols-4 gap-4 items-start">
          {/* Column 1: Round of 16 */}
          {(activeStageView === 'ALL' || activeStageView === 'ROUND_OF_16') && (
            <div className="space-y-4">
              <div className="px-2 py-1 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Round of 16
                </h3>
                <span className="text-[11px] text-slate-500">8 Cross-Pool Ties</span>
              </div>
              <div className="space-y-3">
                {r16Matches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 2: Quarter Finals */}
          {(activeStageView === 'ALL' || activeStageView === 'QUARTER_FINAL') && (
            <div className="space-y-4">
              <div className="px-2 py-1 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Quarter Finals
                </h3>
                <span className="text-[11px] text-slate-500">4 Matches</span>
              </div>
              <div className="space-y-6 pt-2">
                {qfMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 3: Semi Finals */}
          {(activeStageView === 'ALL' || activeStageView === 'SEMI_FINAL') && (
            <div className="space-y-4">
              <div className="px-2 py-1 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Semi Finals
                </h3>
                <span className="text-[11px] text-slate-500">2 Matches</span>
              </div>
              <div className="space-y-12 pt-8">
                {sfMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 4: Final */}
          {(activeStageView === 'ALL' || activeStageView === 'FINAL') && (
            <div className="space-y-4">
              <div className="px-2 py-1 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Grand Final
                </h3>
                <span className="text-[11px] text-slate-500">Championship Match</span>
              </div>
              <div className="pt-20">
                {finalMatch && renderMatchCard(finalMatch)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
