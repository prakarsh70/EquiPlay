import React, { useState } from 'react';
import { Users, UserPlus, Link2, X } from 'lucide-react';
import { Match, SessionPlayer } from '../../types/equiplay';
import { Switch } from '../common/Switch';
import { Badge } from '../common/Badge';
import { formatArrivalTime } from '../../utils/time';

interface BenchZoneProps {
  players: SessionPlayer[];
  matches: Match[];
  onAddPlayer: (name: string, isPresentNow: boolean, partnerId?: string) => void;
  onToggleActive: (playerId: string) => void;
  onSetPartner?: (playerAId: string, playerBId: string | null) => void;
}

type PlayerStatusCategory = 'ON_COURT' | 'UP_NEXT' | 'ON_BENCH' | 'AWAY';

export const BenchZone: React.FC<BenchZoneProps> = ({
  players,
  matches,
  onAddPlayer,
  onToggleActive,
  onSetPartner,
}) => {
  const [walkInName, setWalkInName] = useState('');
  const [walkInPartnerId, setWalkInPartnerId] = useState('');

  const unpartneredPlayers = players.filter((p) => !p.partnerId);

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = walkInName.trim();
    if (!trimmed) return;
    onAddPlayer(trimmed, true, walkInPartnerId || undefined);
    setWalkInName('');
    setWalkInPartnerId('');
  };

  // Determine player status
  const onCourtPlayerIds = new Set<string>();
  const upNextPlayerIds = new Set<string>();

  matches.forEach((m) => {
    if (m.status === 'IN_PROGRESS') {
      onCourtPlayerIds.add(m.teamA[0]);
      onCourtPlayerIds.add(m.teamA[1]);
      onCourtPlayerIds.add(m.teamB[0]);
      onCourtPlayerIds.add(m.teamB[1]);
    } else if (m.status === 'UPCOMING') {
      upNextPlayerIds.add(m.teamA[0]);
      upNextPlayerIds.add(m.teamA[1]);
      upNextPlayerIds.add(m.teamB[0]);
      upNextPlayerIds.add(m.teamB[1]);
    }
  });

  const getPlayerStatus = (player: SessionPlayer): { category: PlayerStatusCategory; label: string } => {
    if (onCourtPlayerIds.has(player.id)) {
      return { category: 'ON_COURT', label: 'On Court' };
    }
    if (upNextPlayerIds.has(player.id)) {
      return { category: 'UP_NEXT', label: 'Up Next' };
    }
    if (player.isActive) {
      return { category: 'ON_BENCH', label: 'Active on Bench' };
    }
    return { category: 'AWAY', label: 'Away / Late' };
  };

  // Sort players by status: On Court -> Up Next -> Active on Bench -> Away / Late
  const statusWeight: Record<PlayerStatusCategory, number> = {
    ON_COURT: 1,
    UP_NEXT: 2,
    ON_BENCH: 3,
    AWAY: 4,
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const statusA = getPlayerStatus(a).category;
    const statusB = getPlayerStatus(b).category;
    if (statusWeight[statusA] !== statusWeight[statusB]) {
      return statusWeight[statusA] - statusWeight[statusB];
    }
    // If both on bench, sort by longest wait
    if (statusA === 'ON_BENCH') {
      return b.consecutiveGamesSatOut - a.consecutiveGamesSatOut;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="space-y-4" aria-labelledby="bench-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h2 id="bench-heading" className="text-lg font-black text-slate-100">
            The Bench & Roster
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-semibold">
          {players.filter((p) => p.isActive).length} Active • {players.length} Total
        </span>
      </div>

      {/* Walk-in Player Input */}
      <form onSubmit={handleAddWalkIn} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={walkInName}
          onChange={(e) => setWalkInName(e.target.value)}
          placeholder="Add unexpected walk-in player..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
        />
        {unpartneredPlayers.length > 0 && (
          <select
            value={walkInPartnerId}
            onChange={(e) => setWalkInPartnerId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
            title="Optionally link with a teammate"
          >
            <option value="">Teammate: (None)</option>
            {unpartneredPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                Teammate: {p.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={!walkInName.trim()}
          className="min-h-[48px] px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <UserPlus className="w-4 h-4" /> Add Walk-in
        </button>
      </form>

      {/* Players List */}
      <div className="space-y-2">
        {sortedPlayers.map((player) => {
          const { category, label } = getPlayerStatus(player);
          const isPlaying = category === 'ON_COURT';
          const partner = player.partnerId
            ? players.find((p) => p.id === player.partnerId)
            : null;
          const availablePartners = players.filter(
            (p) => p.id !== player.id && !p.partnerId
          );

          return (
            <div
              key={player.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                category === 'ON_COURT'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : category === 'UP_NEXT'
                    ? 'bg-amber-400/10 border-amber-400/30'
                    : category === 'ON_BENCH'
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-slate-950 border-slate-900 opacity-60'
              }`}
            >
              {/* Player Info & Status Label */}
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    category === 'ON_COURT'
                      ? 'bg-emerald-400 animate-pulse'
                      : category === 'UP_NEXT'
                        ? 'bg-amber-400'
                        : category === 'ON_BENCH'
                          ? 'bg-slate-400'
                          : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{player.name}</span>
                    <Badge
                      variant={
                        category === 'ON_COURT'
                          ? 'emerald'
                          : category === 'UP_NEXT'
                            ? 'amber'
                            : category === 'ON_BENCH'
                              ? 'slate'
                              : 'rose'
                      }
                      className="text-[10px] py-0 px-2 font-medium"
                    >
                      {label}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                    <span>Arrived: {formatArrivalTime(player.arrivalTime)}</span>
                    {partner ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-[10px]">
                        <Link2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Teammate: {partner.name}</span>
                        <button
                          type="button"
                          onClick={() => onSetPartner?.(player.id, null)}
                          className="hover:text-rose-400 text-slate-400 p-0.5"
                          title="Unlink teammate"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ) : availablePartners.length > 0 ? (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onSetPartner?.(player.id, e.target.value);
                          }
                        }}
                        className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">+ Team Up</option>
                        {availablePartners.map((other) => (
                          <option key={other.id} value={other.id}>
                            {other.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Badges & Switch */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Played</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {player.gamesPlayedToday}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Bench Wait</span>
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      {player.consecutiveGamesSatOut} sat
                    </span>
                  </div>
                </div>

                {/* Accessible Toggle Active / Away */}
                <Switch
                  checked={player.isActive}
                  onChange={() => onToggleActive(player.id)}
                  ariaLabel={`Toggle ${player.name} between active and away`}
                  disabled={isPlaying}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

