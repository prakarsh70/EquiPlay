import React, { useState } from 'react';
import { Users, UserPlus, Trash2, CheckCircle2, Clock3, Link2, X } from 'lucide-react';
import { useMatchStore } from '../../store/useMatchStore';
import { Switch } from '../common/Switch';
import { Badge } from '../common/Badge';

export const RosterBuilder: React.FC = () => {
  const { players, addPlayer, removePlayer, togglePlayerActive, setPlayerPartner } = useMatchStore();
  const [nameInput, setNameInput] = useState('');
  const [isPresentNow, setIsPresentNow] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  // Players who are not partnered yet
  const unpartneredPlayers = players.filter((p) => !p.partnerId);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    addPlayer(trimmed, isPresentNow, selectedPartnerId || undefined);
    setNameInput('');
    setSelectedPartnerId('');
  };

  const activeCount = players.filter((p) => p.isActive).length;
  const awayCount = players.length - activeCount;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-slate-100">Roster Builder</h3>
            <p className="text-xs text-slate-400">
              Add attendees for today&apos;s session (min. 4 active)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="emerald" dot>
            {activeCount} Present
          </Badge>
          {awayCount > 0 && (
            <Badge variant="amber" dot>
              {awayCount} Late
            </Badge>
          )}
        </div>
      </div>

      {/* Input form with Here Now toggle and optional partner */}
      <form onSubmit={handleAddPlayer} className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Player name (e.g. Alex, Sam)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
          />
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 min-h-[48px]">
            <Switch
              checked={isPresentNow}
              onChange={setIsPresentNow}
              label={isPresentNow ? 'Here Now' : 'Running Late'}
              ariaLabel="Player attendance toggle"
            />
          </div>
          {unpartneredPlayers.length > 0 && (
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
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
            disabled={!nameInput.trim()}
            className="min-h-[48px] px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <UserPlus className="w-4 h-4" /> Add Player
          </button>
        </div>
      </form>

      {/* Players List */}
      <div className="pt-2">
        {players.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
            No players added yet. Add at least 4 players to start the session.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {players.map((player) => {
              const partner = player.partnerId
                ? players.find((p) => p.id === player.partnerId)
                : null;
              const availablePartners = players.filter(
                (p) => p.id !== player.id && !p.partnerId
              );

              return (
                <div
                  key={player.id}
                  className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          player.isActive ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <div className="truncate">
                        <span className="text-sm font-semibold text-slate-200 block truncate">
                          {player.name}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          {player.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" /> Present
                            </>
                          ) : (
                            <>
                              <Clock3 className="w-3 h-3 text-amber-400 inline" /> Running Late
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePlayerActive(player.id)}
                        aria-label={`Toggle active status for ${player.name}`}
                        className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 min-h-[36px]"
                      >
                        {player.isActive ? 'Mark Late' : 'Mark Here'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlayer(player.id)}
                        aria-label={`Remove ${player.name}`}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Teammate / Partner Badge or Link Selector */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-emerald-400" /> Teammate:
                    </span>

                    {partner ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
                        <span>{partner.name}</span>
                        <button
                          type="button"
                          onClick={() => setPlayerPartner(player.id, null)}
                          className="hover:text-rose-400 text-slate-400 p-0.5"
                          title="Unlink teammate"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : availablePartners.length > 0 ? (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setPlayerPartner(player.id, e.target.value);
                          }
                        }}
                        className="text-[11px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">+ Link Teammate</option>
                        {availablePartners.map((other) => (
                          <option key={other.id} value={other.id}>
                            {other.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

