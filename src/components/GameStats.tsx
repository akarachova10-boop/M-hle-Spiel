/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MatchRecord, Difficulty } from '../types';
import { Trophy, Clock, Trash2, ArrowUpDown, History, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface GameStatsProps {
  records: MatchRecord[];
  onClearStats: () => void;
  textPrimary: string;
}

export default function GameStats({ records, onClearStats, textPrimary }: GameStatsProps) {
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'ALL'>('ALL');
  const [showConfirm, setShowConfirm] = useState(false);

  // Compute calculated metrics
  const totalGames = records.length;
  const wins = records.filter(r => r.winner === 'PLAYER').length;
  const losses = records.filter(r => r.winner === 'COMPUTER').length;
  const draws = records.filter(r => r.winner === 'DRAW').length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // Filtered records
  const filteredRecords = records
    .filter(r => filterDifficulty === 'ALL' || r.difficulty === filterDifficulty)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first

  // Helper to format duration
  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec} Min`;
  };

  // Helper to format date
  const formatDateString = (dtStr: string) => {
    try {
      const dt = new Date(dtStr);
      return dt.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dtStr;
    }
  };

  return (
    <div id="game-stats-container" className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Win Rate */}
        <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Erfolgsquote</span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-sans text-amber-400">{winRate}%</span>
          </div>
          <span className="text-[10px] text-stone-500">{wins} Siege von {totalGames} Spielen</span>
        </div>

        {/* Wins */}
        <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3 h-3 text-emerald-400" /> Siege
          </span>
          <span className="text-2xl font-black font-sans text-emerald-50">{wins}</span>
          <span className="text-[10px] text-stone-500">Gegen Computer</span>
        </div>

        {/* Losses */}
        <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Niederlagen</span>
          <span className="text-2xl font-black font-sans text-stone-400">{losses}</span>
          <span className="text-[10px] text-stone-500">Lerne aus Fehlern!</span>
        </div>

        {/* Draws */}
        <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Remis</span>
          <span className="text-2xl font-black font-sans text-[#e0e0e0]">{draws}</span>
          <span className="text-[10px] text-stone-500">Unentschieden</span>
        </div>
      </div>

      {/* Match History List */}
      <div className="bg-stone-900/20 border border-stone-800/60 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h4 className="font-sans font-bold text-white text-sm">Spiel-Historie</h4>
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2">
            {/* Filter difficulty */}
            <select
              id="difficulty-filter"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'ALL')}
              className="text-xs font-medium px-2 py-1 bg-stone-800 border border-stone-700 text-stone-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Alle Stufen</option>
              <option value="EASY">Leicht</option>
              <option value="MEDIUM">Mittel</option>
              <option value="HARD">Schwer</option>
            </select>

            {/* Clear button */}
            {totalGames > 0 && (
              <button
                id="toggle-clear-stats"
                onClick={() => setShowConfirm(!showConfirm)}
                className="p-1 px-2 rounded-lg text-xs font-semibold hover:bg-stone-800 text-rose-400 flex items-center gap-1 transition-all"
                title="Statistiken zurücksetzen"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Löschen</span>
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Overlay inside container */}
        {showConfirm && (
          <div className="bg-rose-950/25 border border-rose-900/40 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-200">Bist du sicher? Alle Statistiken werden dauerhaft gelöscht.</p>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                id="confirm-delete-stats"
                onClick={() => {
                  onClearStats();
                  setShowConfirm(false);
                }}
                className="px-2.5 py-1 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white"
              >
                Ja, löschen
              </button>
              <button
                id="cancel-delete-stats"
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* History table or empty placeholder */}
        {filteredRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 rounded-lg border border-dashed border-stone-800/80">
            {totalGames === 0 ? 'Noch keine archivierten Runden vorhanden.' : 'Keine Runden für die ausgewählte Schwierigkeitsstufe.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead>
                <tr className="border-b border-stone-800/80 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2">Datum</th>
                  <th className="py-2.5 px-2">Ergebnis</th>
                  <th className="py-2.5 px-2">Schwierigkeit</th>
                  <th className="py-2.5 px-2">Züge</th>
                  <th className="py-2.5 px-2 text-right">Dauer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-900/10 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-[11px] text-stone-400">
                      {formatDateString(rec.date)}
                    </td>
                    <td className="py-2.5 px-2 font-sans font-semibold">
                      {rec.winner === 'PLAYER' && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Gewinn
                        </span>
                      )}
                      {rec.winner === 'COMPUTER' && (
                        <span className="text-rose-400">Verlust</span>
                      )}
                      {rec.winner === 'DRAW' && (
                        <span className="text-amber-400">Unentschieden</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-stone-300">
                      {rec.difficulty === 'EASY' && <span className="text-stone-400 text-[11px]">Leicht</span>}
                      {rec.difficulty === 'MEDIUM' && <span className="text-amber-300/80 text-[11px]">Mittel</span>}
                      {rec.difficulty === 'HARD' && <span className="text-rose-400 text-[11px] font-semibold">Schwer</span>}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] font-medium text-stone-300">
                      {rec.turnsCount} Züge
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-[11px] text-stone-400">
                      {formatDuration(rec.durationSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
