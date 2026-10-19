import React, { useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Layers,
  Zap,
  BarChart3,
  Users,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  GroupId,
  TournamentFormat,
  TournamentPointFormat,
} from '../../types/tournament';
import { useTournamentStore } from '../../store/useTournamentStore';
import { TOURNAMENT_GROUPS } from '../../data/tournamentSeed';
import { Button } from '../common/Button';
import { CourtSelector } from '../common/CourtSelector';

interface TournamentSetupViewProps {
  onSwitchMode: () => void;
}

export const TournamentSetupView: React.FC<TournamentSetupViewProps> = ({
  onSwitchMode,
}) => {
  const {
    config,
    teams,
    courts,
    addCourt,
    removeCourt,
    setConfig,
    setTournamentFormat,
    setPointsFormat,
    addTeam,
    removeTeam,
    loadSampleRoster,
    clearAllTeams,
    startTournament,
  } = useTournamentStore();

  // Scroll reset to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = '';
  }, []);

  // Add team form state
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [alias, setAlias] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupId>('A');

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1.trim()) return;
    if (config.isDoubles && !player2.trim()) return;

    addTeam({
      player1: player1.trim(),
      player2: config.isDoubles ? player2.trim() : undefined,
      alias: alias.trim() || undefined,
      group:
        config.format === 'GROUP_KNOCKOUT' || config.format === 'GROUP_CONSOLATION'
          ? selectedGroup
          : undefined,
    });

    setPlayer1('');
    setPlayer2('');
    setAlias('');
  };

  // Validation
  const canStart = (() => {
    if (courts.length < 1) return false;
    if (
      config.format === 'GROUP_KNOCKOUT' ||
      config.format === 'GROUP_CONSOLATION'
    ) {
      return teams.length >= 4;
    }
    if (config.format === 'ROUND_ROBIN' || config.format === 'KNOCKOUT') {
      return teams.length >= 2;
    }
    return false;
  })();

  const formatCards: Array<{
    key: TournamentFormat;
    title: string;
    badge: string;
    icon: React.ReactNode;
    desc: string;
  }> = [
    {
      key: 'GROUP_KNOCKOUT',
      title: 'Pool Stage + Knockout',
      badge: 'World Cup Style',
      icon: <Layers className="w-6 h-6 text-emerald-400" />,
      desc: 'Teams are split into pools (Groups A–H) for round-robin play. The top 2 from each pool advance to the Round of 16 bracket.',
    },
    {
      key: 'GROUP_CONSOLATION',
      title: 'Pools + Cup & Plate',
      badge: 'Dual Knockouts',
      icon: <Trophy className="w-6 h-6 text-sky-400" />,
      desc: 'Top 2 advance to Championship Cup; bottom 2 advance to Consolation Plate. Every single team gets knockout games!',
    },
    {
      key: 'ROUND_ROBIN',
      title: 'Pure Round Robin',
      badge: 'League Table',
      icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
      desc: 'All teams play against every other team in one unified table. Ranks are strictly decided by Wins, Head-to-Head, and Point Diff.',
    },
    {
      key: 'KNOCKOUT',
      title: 'Pure Knockout',
      badge: 'Sudden Death',
      icon: <Zap className="w-6 h-6 text-rose-400" />,
      desc: 'Instant bracket elimination. Every match is do-or-die. Losers exit, winners advance to the Championship Final.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSwitchMode}
            className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Mode Hub</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Tournament Setup</span>
          </div>
        </div>
      </header>

      {/* Setup Form Container */}
      <main className="max-w-4xl mx-auto w-full px-4 py-6 space-y-8 flex-1">
        {/* Intro */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Step 1 • Tournament Configuration
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Configure Your Arena
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Select your tournament format, set your match points, and build your team roster.
          </p>
        </div>

        {/* STEP 1: Format Selector Cards */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
            1. Select Tournament Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatCards.map((fmt) => (
              <button
                key={fmt.key}
                type="button"
                onClick={() => setTournamentFormat(fmt.key)}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] ${
                  config.format === fmt.key
                    ? 'bg-slate-900 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {fmt.icon}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                        {fmt.badge}
                      </span>
                      <div
                        className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                          config.format === fmt.key
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                            : 'border-slate-700 bg-slate-850 hover:border-slate-600'
                        }`}
                      >
                        {config.format === fmt.key && (
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100">
                      {fmt.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {fmt.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold transition-colors ${
                      config.format === fmt.key
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {config.format === fmt.key ? 'Selected Format' : 'Tap to select'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: General Settings */}
        <div className="space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
            2. Match Rules &amp; Naming
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tournament Title */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-400">
                Tournament Title
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ name: e.target.value })}
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Match Point Format */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-400">
                Target Points Format
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([11, 15, 21, 30] as TournamentPointFormat[]).map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setPointsFormat(pts)}
                    className={`min-h-[48px] rounded-xl text-xs font-bold transition-all border ${
                      config.pointsFormat === pts
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {/* Doubles vs Singles */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-400">
                Game Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ isDoubles: true })}
                  className={`min-h-[48px] rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    config.isDoubles
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Doubles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ isDoubles: false })}
                  className={`min-h-[48px] rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    !config.isDoubles
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Singles</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Arena Courts Configuration */}
        <CourtSelector
          courts={courts}
          onAddCourt={addCourt}
          onRemoveCourt={removeCourt}
          title="3. Arena Courts Configuration"
          subtitle="Add arena courts where tournament matches will be scheduled and live streamed"
          minCourts={1}
        />

        {/* STEP 4: Roster Builder */}
        <div className="space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                4. Build Roster ({teams.length} Teams Registered)
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Add your teams manually, or load the seeded 32-team template with one tap.
              </p>
            </div>

            {/* Template Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadSampleRoster}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 32-Team Sample</span>
              </button>

              {teams.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllTeams}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Add Team Inline Form */}
          <form
            onSubmit={handleAddTeam}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3"
          >
            <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Add New {config.isDoubles ? 'Pair / Team' : 'Player'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder={config.isDoubles ? 'Player 1 name' : 'Player name'}
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                className="min-h-[48px] px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              {config.isDoubles && (
                <input
                  type="text"
                  required
                  placeholder="Player 2 name"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  className="min-h-[48px] px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              )}

              <input
                type="text"
                placeholder="Team Alias (Optional)"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="min-h-[48px] px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />

              {config.format === 'GROUP_KNOCKOUT' ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value as GroupId)}
                    className="flex-1 min-h-[48px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {TOURNAMENT_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        Pool {grp}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-950/20"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className="min-h-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 font-bold active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-950/20 text-xs"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Team</span>
                </button>
              )}
            </div>
          </form>

          {/* Group Balance Pills (If GROUP_KNOCKOUT) */}
          {config.format === 'GROUP_KNOCKOUT' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Pool Counts:
              </span>
              {TOURNAMENT_GROUPS.map((grp) => {
                const count = teams.filter((t) => t.group === grp).length;
                return (
                  <div
                    key={grp}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                      count === 4
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : count > 0
                        ? 'bg-amber-400/10 border-amber-400/30 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>Pool {grp}:</span>
                    <span className="font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Team List Preview */}
          {teams.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-slate-400">
                No teams registered yet.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add teams manually above, or tap &ldquo;Load 32-Team Sample&rdquo; to test with the official pre-seeded roster.
              </p>
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                      #{team.teamNumber}
                    </span>

                    <div className="truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-200 truncate block">
                        {team.player1}
                        {team.player2 ? ` & ${team.player2}` : ''}
                      </span>
                      {team.alias && (
                        <span className="text-[11px] font-semibold text-amber-400 truncate block">
                          {team.alias}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {team.group && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Pool {team.group}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeTeam(team.id)}
                      aria-label="Remove team"
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation Warning */}
        {!canStart && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {courts.length < 1
                ? 'Please add at least 1 arena court to schedule matches.'
                : config.format === 'GROUP_KNOCKOUT' || config.format === 'GROUP_CONSOLATION'
                ? 'At least 4 teams are required to launch a pool tournament.'
                : 'At least 2 teams are required to launch this tournament.'}
            </span>
          </div>
        )}

        {/* Launch CTA */}
        <div className="sticky bottom-4 pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canStart}
            onClick={startTournament}
            className="shadow-2xl shadow-emerald-950/60"
          >
            <Trophy className="w-5 h-5 mr-2" />
            <span>Generate Fixtures &amp; Launch Tournament</span>
          </Button>
        </div>
      </main>
    </div>
  );
};
