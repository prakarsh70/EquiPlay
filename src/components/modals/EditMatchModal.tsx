import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, PhoneCall, Check, AlertCircle, MapPin } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface EditMatchModalProps {
  isOpen: boolean;
  match: Match | null;
  players: SessionPlayer[];
  matches: Match[];
  courtNames: string[];
  onClose: () => void;
  onSaveLineup: (
    matchId: string,
    teamA: [string, string],
    teamB: [string, string],
    courtName?: string
  ) => void;
  onMarkAway: (playerId: string) => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  isOpen,
  match,
  players,
  matches,
  courtNames,
  onClose,
  onSaveLineup,
  onMarkAway,
}) => {
  const [teamA, setTeamA] = useState<[string, string]>(['', '']);
  const [teamB, setTeamB] = useState<[string, string]>(['', '']);
  const [courtName, setCourtName] = useState<string>('');
  const [markAwayPlayerId, setMarkAwayPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setTeamA([...match.teamA]);
      setTeamB([...match.teamB]);
      setCourtName(match.courtName);
      setMarkAwayPlayerId(null);
    }
  }, [match]);

  if (!match) return null;

  // Find players currently on court in other matches
  const onCourtOtherMatchIds = new Set<string>();
  matches
    .filter((m) => m.status === 'IN_PROGRESS' && m.id !== match.id)
    .forEach((m) => {
      onCourtOtherMatchIds.add(m.teamA[0]);
      onCourtOtherMatchIds.add(m.teamA[1]);
      onCourtOtherMatchIds.add(m.teamB[0]);
      onCourtOtherMatchIds.add(m.teamB[1]);
    });

  // Available candidate players (not currently playing in another match)
  const candidatePlayers = players.filter((p) => !onCourtOtherMatchIds.has(p.id));

  const allSelectedIds = [teamA[0], teamA[1], teamB[0], teamB[1]];
  const hasDuplicates = new Set(allSelectedIds).size !== 4;
  const hasEmpty = allSelectedIds.some((id) => !id);
  const isValid = !hasDuplicates && !hasEmpty;

  const handleSwapPartners = () => {
    setTeamA([teamA[0], teamB[0]]);
    setTeamB([teamA[1], teamB[1]]);
  };

  const handleSwapTeams = () => {
    setTeamA([...teamB]);
    setTeamB([...teamA]);
  };

  const handleSave = () => {
    if (!isValid) return;

    if (markAwayPlayerId) {
      onMarkAway(markAwayPlayerId);
    }

    onSaveLineup(match.id, teamA, teamB, courtName);
    onClose();
  };

  const renderPlayerSelect = (
    value: string,
    onChange: (val: string) => void,
    label: string,
    teamColor: string
  ) => {
    return (
      <div className="space-y-1">
        <label className={`text-xs font-bold uppercase tracking-wider block ${teamColor}`}>
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
        >
          {candidatePlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} {player.isActive ? `(${player.gamesPlayedToday} games)` : '(Away)'}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const replacedPlayerIds = [...match.teamA, ...match.teamB].filter(
    (originalId) => !allSelectedIds.includes(originalId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manual Lineup: ${match.courtName}`}
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-400">
          Manually pick or swap players for this match, or reassign to an open court.
        </p>

        {/* Court Reassignment Selector */}
        <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Assigned Court
          </label>
          <select
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            {courtNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Swap Helpers */}
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

        {/* Team Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team A */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
              Team A Lineup
            </span>
            {renderPlayerSelect(
              teamA[0],
              (val) => setTeamA([val, teamA[1]]),
              'Player 1',
              'text-emerald-400'
            )}
            {renderPlayerSelect(
              teamA[1],
              (val) => setTeamA([teamA[0], val]),
              'Player 2',
              'text-emerald-400'
            )}
          </div>

          {/* Team B */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-black text-sky-400 uppercase tracking-wider block">
              Team B Lineup
            </span>
            {renderPlayerSelect(
              teamB[0],
              (val) => setTeamB([val, teamB[1]]),
              'Player 3',
              'text-sky-400'
            )}
            {renderPlayerSelect(
              teamB[1],
              (val) => setTeamB([teamB[0], val]),
              'Player 4',
              'text-sky-400'
            )}
          </div>
        </div>

        {/* Urgent Call / Mark Replaced Player as Away */}
        {replacedPlayerIds.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <PhoneCall className="w-4 h-4" />
              <span>Did a replaced player have to step away?</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {replacedPlayerIds.map((pId) => {
                const player = players.find((p) => p.id === pId);
                if (!player) return null;
                const isSelectedToMarkAway = markAwayPlayerId === pId;

                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() =>
                      setMarkAwayPlayerId(isSelectedToMarkAway ? null : pId)
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                      isSelectedToMarkAway
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isSelectedToMarkAway ? `✓ Marking ${player.name} Away` : `Mark ${player.name} Away`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {hasDuplicates && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Each of the 4 positions must have a different player.</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            fullWidth
            disabled={!isValid}
          >
            <Check className="w-5 h-5 mr-1.5" /> Confirm Lineup
          </Button>
        </div>
      </div>
    </Modal>
  );
};
