import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, MapPin, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ManualMatchModalProps {
  isOpen: boolean;
  defaultCourtName: string;
  courtNames: string[];
  players: SessionPlayer[];
  matches: Match[];
  onClose: () => void;
  onCreateMatch: (
    courtName: string,
    teamA: [string, string],
    teamB: [string, string],
    startImmediately: boolean
  ) => void;
}

export const ManualMatchModal: React.FC<ManualMatchModalProps> = ({
  isOpen,
  defaultCourtName,
  courtNames,
  players,
  matches,
  onClose,
  onCreateMatch,
}) => {
  const [courtName, setCourtName] = useState<string>(defaultCourtName || courtNames[0] || 'Court 1');
  const [teamA, setTeamA] = useState<[string, string]>(['', '']);
  const [teamB, setTeamB] = useState<[string, string]>(['', '']);

  // Find players currently on court in active matches
  const onCourtPlayerIds = new Set<string>();
  matches
    .filter((m) => m.status === 'IN_PROGRESS')
    .forEach((m) => {
      onCourtPlayerIds.add(m.teamA[0]);
      onCourtPlayerIds.add(m.teamA[1]);
      onCourtPlayerIds.add(m.teamB[0]);
      onCourtPlayerIds.add(m.teamB[1]);
    });

  // Available candidate players for manual selection (must be active and not on court)
  const candidatePlayers = players.filter((p) => !onCourtPlayerIds.has(p.id) && p.isActive);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setCourtName(defaultCourtName || courtNames[0] || 'Court 1');

      // Auto-populate with top available bench players
      if (candidatePlayers.length >= 4) {
        setTeamA([candidatePlayers[0].id, candidatePlayers[3].id]);
        setTeamB([candidatePlayers[1].id, candidatePlayers[2].id]);
      } else {
        setTeamA(['', '']);
        setTeamB(['', '']);
      }
    }
  }, [isOpen, defaultCourtName]);

  if (!isOpen) return null;

  const isCourtCurrentlyPlaying = matches.some(
    (m) => m.courtName === courtName && m.status === 'IN_PROGRESS'
  );

  const allSelectedIds = [teamA[0], teamA[1], teamB[0], teamB[1]];
  const hasDuplicates = new Set(allSelectedIds).size !== 4;
  const hasEmpty = allSelectedIds.some((id) => !id);
  const hasEnoughPlayers = candidatePlayers.length >= 4;
  const isValid = !hasDuplicates && !hasEmpty && hasEnoughPlayers;

  const handleSelectPlayer = (
    slot: 'A1' | 'A2' | 'B1' | 'B2',
    playerId: string
  ) => {
    const selectedPlayer = players.find((p) => p.id === playerId);
    const partnerId = selectedPlayer?.partnerId;

    if (slot === 'A1') {
      // If player has linked partner and A2 is empty, auto-fill partner into A2!
      const newA2 = partnerId && candidatePlayers.some((p) => p.id === partnerId) && !teamA[1] ? partnerId : teamA[1];
      setTeamA([playerId, newA2]);
    } else if (slot === 'A2') {
      setTeamA([teamA[0], playerId]);
    } else if (slot === 'B1') {
      const newB2 = partnerId && candidatePlayers.some((p) => p.id === partnerId) && !teamB[1] ? partnerId : teamB[1];
      setTeamB([playerId, newB2]);
    } else if (slot === 'B2') {
      setTeamB([teamB[0], playerId]);
    }
  };

  const handleSwapPartners = () => {
    setTeamA([teamA[0], teamB[0]]);
    setTeamB([teamA[1], teamB[1]]);
  };

  const handleSwapTeams = () => {
    setTeamA([...teamB]);
    setTeamB([...teamA]);
  };

  const handleStartNow = () => {
    if (!isValid || isCourtCurrentlyPlaying) return;
    onCreateMatch(courtName, teamA, teamB, true);
    onClose();
  };

  const handleQueueOnly = () => {
    if (!isValid) return;
    onCreateMatch(courtName, teamA, teamB, false);
    onClose();
  };

  const renderDropdown = (
    slot: 'A1' | 'A2' | 'B1' | 'B2',
    val: string,
    label: string,
    labelColor: string
  ) => {
    return (
      <div className="space-y-1">
        <label className={`text-xs font-bold uppercase tracking-wider block ${labelColor}`}>
          {label}
        </label>
        <select
          value={val}
          onChange={(e) => handleSelectPlayer(slot, e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
        >
          <option value="">-- Select Player --</option>
          {candidatePlayers.map((p) => {
            const partner = p.partnerId ? players.find((pl) => pl.id === p.partnerId) : null;
            const isPickedInAnotherSlot =
              allSelectedIds.filter((id) => id && id !== val).includes(p.id);

            return (
              <option
                key={p.id}
                value={p.id}
                disabled={isPickedInAnotherSlot}
              >
                {p.name} {isPickedInAnotherSlot ? '(Selected)' : partner ? `(Partner: ${partner.name})` : `(${p.gamesPlayedToday} games)`}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Match: Put Players on Court"
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-400">
          Pick any 4 players manually and choose to either put them on court immediately or queue them up next.
        </p>

        {/* Insufficient Candidate Players Warning */}
        {!hasEnoughPlayers && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Insufficient Players Off-Court</span>
            </div>
            <p>
              Doubles requires 4 active players off court, but only{' '}
              <strong className="text-amber-100 font-bold">{candidatePlayers.length}</strong> active player
              {candidatePlayers.length === 1 ? ' is' : 's are'} currently off court
              {candidatePlayers.length > 0 ? ` (${candidatePlayers.map((p) => p.name).join(', ')})` : ''}
              . Wait for an on-court match to finish or add walk-in players.
            </p>
          </div>
        )}

        {/* Court Selection */}
        <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Target Court
          </label>
          <div className="flex gap-2">
            {courtNames.map((c) => {
              const isSelected = courtName === c;
              const isPlaying = matches.some(
                (m) => m.courtName === c && m.status === 'IN_PROGRESS'
              );

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourtName(c)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all min-h-[44px] ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlaying ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{c}</span>
                  <span className="text-[10px] opacity-80">
                    ({isPlaying ? 'Busy' : 'Open'})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Lineup Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team A */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
              Team A Lineup
            </span>
            {renderDropdown('A1', teamA[0], 'Player 1', 'text-emerald-400')}
            {renderDropdown('A2', teamA[1], 'Player 2', 'text-emerald-400')}
          </div>

          {/* Team B */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-black text-sky-400 uppercase tracking-wider block">
              Team B Lineup
            </span>
            {renderDropdown('B1', teamB[0], 'Player 3', 'text-sky-400')}
            {renderDropdown('B2', teamB[1], 'Player 4', 'text-sky-400')}
          </div>
        </div>

        {/* Quick Swaps */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSwapPartners}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors border border-slate-700 min-h-[44px]"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swap Partners</span>
          </button>
          <button
            type="button"
            onClick={handleSwapTeams}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors border border-slate-700 min-h-[44px]"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
            <span>Swap Teams</span>
          </button>
        </div>

        {/* Validation Errors */}
        {hasDuplicates && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please select 4 distinct players.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid || isCourtCurrentlyPlaying}
            onClick={handleStartNow}
            className="shadow-xl shadow-emerald-950/40"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            {isCourtCurrentlyPlaying
              ? `${courtName} is Playing (Use Queue)`
              : `Put on ${courtName} Immediately`}
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} fullWidth>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={!isValid}
              onClick={handleQueueOnly}
              fullWidth
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Add as Up Next
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
