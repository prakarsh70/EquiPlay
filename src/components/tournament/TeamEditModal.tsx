import React, { useState, useEffect } from 'react';
import { Tag, Check, Users, Layers } from 'lucide-react';
import { GroupId, TournamentTeam } from '../../types/tournament';
import { TOURNAMENT_GROUPS } from '../../data/tournamentSeed';
import { Modal } from '../common/Modal';

interface TeamEditModalProps {
  isOpen: boolean;
  team: TournamentTeam | null;
  onClose: () => void;
  onSave: (
    teamId: string,
    player1: string,
    player2: string,
    alias?: string,
    group?: GroupId
  ) => void;
  isMatchStarted?: boolean;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  isOpen,
  team,
  onClose,
  onSave,
  isMatchStarted = false,
}) => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [alias, setAlias] = useState('');
  const [group, setGroup] = useState<GroupId | undefined>(undefined);

  useEffect(() => {
    if (team) {
      setPlayer1(team.player1);
      setPlayer2(team.player2 || '');
      setAlias(team.alias ?? '');
      setGroup(team.group);
    } else {
      setPlayer1('');
      setPlayer2('');
      setAlias('');
      setGroup('A');
    }
  }, [team, isOpen]);

  if (!isOpen) return null;

  const isAddMode = !team;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1.trim()) return;

    onSave(
      team?.id || '',
      player1.trim(),
      player2.trim(),
      alias.trim() || undefined,
      isMatchStarted ? team?.group : group
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAddMode ? 'Add New Team' : `Edit Team #${team.teamNumber}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player 1 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Player 1
          </label>
          <input
            type="text"
            required
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            placeholder="e.g. Chandan"
            className="w-full min-h-[48px] px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
          />
        </div>

        {/* Player 2 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Player 2 (Optional if singles)
          </label>
          <input
            type="text"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            placeholder="e.g. Abhijeet"
            className="w-full min-h-[48px] px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
          />
        </div>

        {/* Alias / Team Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            Team Alias (Optional)
          </label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="e.g. LM Warriors"
            className="w-full min-h-[48px] px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Pool / Group Assignment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Pool Group (For Pool Tournaments)
            {isMatchStarted && (
              <span className="text-[10px] text-amber-400 normal-case font-normal ml-1">
                (Locked: matches underway)
              </span>
            )}
          </label>
          <select
            value={group || ''}
            disabled={isMatchStarted}
            onChange={(e) => setGroup((e.target.value as GroupId) || undefined)}
            className="w-full min-h-[48px] px-4 rounded-xl bg-slate-800 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all cursor-pointer"
          >
            <option value="">No Pool / General</option>
            {TOURNAMENT_GROUPS.map((grp) => (
              <option key={grp} value={grp}>
                Pool {grp}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!player1.trim()}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-950/30 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
