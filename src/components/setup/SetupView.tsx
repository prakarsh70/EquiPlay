import React from 'react';
import { Play, Sparkles, ShieldCheck } from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { CourtManager } from './CourtManager';
import { DurationPicker } from './DurationPicker';
import { PointFormatSelector } from './PointFormatSelector';
import { RosterBuilder } from './RosterBuilder';
import { Button } from '../common/Button';

export const SetupView: React.FC = () => {
  const { config, players, startSession } = useMatchStore();

  const activePlayersCount = players.filter((p) => p.isActive).length;
  const hasEnoughPlayers = activePlayersCount >= 4;
  const hasCourts = config.courtNames.length >= 1;
  const canStart = hasEnoughPlayers && hasCourts;

  const handleStart = () => {
    if (!canStart) return;
    startSession();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Courtside Kinetic Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
          Equi<span className="text-emerald-400">Play</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Badminton session matchmaking and fair court rotation. 100% offline & courtside ready.
        </p>
      </div>

      {/* Setup Form Sections */}
      <CourtManager />
      <DurationPicker />
      <PointFormatSelector />
      <RosterBuilder />

      {/* Offline Guarantee Banner */}
      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Session data persists locally in your browser. No network required.</span>
      </div>

      {/* Start Session CTA */}
      <div className="sticky bottom-4 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canStart}
          onClick={handleStart}
          className="shadow-xl shadow-emerald-950/40"
        >
          <Play className="w-5 h-5 fill-current mr-2" />
          {!hasCourts
            ? 'Add at least 1 Court to Start'
            : !hasEnoughPlayers
              ? `Need ${4 - activePlayersCount} More Present Player${4 - activePlayersCount === 1 ? '' : 's'} (Min 4)`
              : `Start Session (${activePlayersCount} Players • ${config.courtNames.length} Court${config.courtNames.length > 1 ? 's' : ''})`}
        </Button>
      </div>
    </div>
  );
};

