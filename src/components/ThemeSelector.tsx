/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppTheme } from '../types';
import { APP_THEMES } from '../utils/themes';
import { Check, Sparkles, CheckCircle } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export default function ThemeSelector({ currentTheme, onSelectTheme }: ThemeSelectorProps) {
  return (
    <div id="theme-selector-section" className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="font-sans font-bold text-lg text-inherit">Design Vorschläge</h3>
      </div>
      <p className="text-xs text-inherit opacity-85 leading-normal">
        Mühle, neu interpretiert. Wählen Sie eines der vier exklusiv gestalteten Designs, um die Atmosphäre des Spielbretts anzupassen.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {APP_THEMES.map((theme) => {
          const isSelected = theme.id === currentTheme.id;

          // Compute custom styles for cards to render dark/light options gracefully
          const isLightTheme = theme.id === 'modern-bauhaus' || theme.id === 'natural-tones';

          return (
            <button
              id={`theme-btn-${theme.id}`}
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`relative flex flex-col p-4 text-left rounded-2xl border transition-all duration-300 group overflow-hidden focus:outline-none ${
                isLightTheme
                  ? 'bg-stone-50 text-stone-900 shadow-sm border-stone-200 hover:border-stone-400'
                  : 'bg-stone-900/40 text-stone-100 border-stone-800 hover:border-stone-700'
              } ${isSelected ? 'ring-2 ring-amber-400 border-transparent shadow-lg scale-[1.01]' : 'opacity-90 hover:opacity-100'}`}
            >
              {/* Active ribbon */}
              {isSelected && (
                <div className="absolute top-0 right-0 py-1.5 px-3 bg-gradient-to-l from-amber-400 to-amber-500 rounded-bl-xl text-stone-950 flex items-center gap-1 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Aktiv</span>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Title & Tagline */}
              <div className="space-y-0.5 pr-14">
                <span className="text-xs font-semibold select-none opacity-60 uppercase tracking-widest block">
                  {theme.tagline}
                </span>
                <span className="font-sans font-bold text-base leading-snug tracking-tight block">
                  {theme.name}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs opacity-75 mt-2 leading-relaxed flex-1">
                {theme.description}
              </p>

              {/* Mini Board Swatch Preview */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-current/10 justify-between">
                <div className="flex gap-1.5 items-center">
                  {/* Outer circle representing Board BG */}
                  <div
                    className="w-5 h-5 rounded-full border border-current/20 flex items-center justify-center relative"
                    style={{ backgroundColor: theme.boardBg }}
                    title="Spielbrett Farbe"
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.boardLines }} />
                  </div>
                  {/* Color pills */}
                  <div className="flex -space-x-1.5">
                    <div className={`w-4 h-4 rounded-full ${theme.playerPiece}`} title="Weißer Spieler" />
                    <div className={`w-4 h-4 rounded-full ${theme.computerPiece}`} title="Schwarzer Spieler" />
                  </div>
                </div>

                <span className="text-[10px] font-mono tracking-tight font-bold opacity-60">
                  {theme.id === 'natural-tones' && 'WARM IVORY & SAGE'}
                  {theme.id === 'classic-wood' && 'WALNUSS & OAK'}
                  {theme.id === 'cyberpunk-neon' && 'HEX CYBERPUNK'}
                  {theme.id === 'modern-bauhaus' && 'SWISS GEOMETRIC'}
                  {theme.id === 'royal-emerald' && 'EMERALD FELT'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
