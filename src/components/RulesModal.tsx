/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Layers, Zap, Info } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export default function RulesModal({ isOpen, onClose, accentColor }: RulesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="rules-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            id="rules-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-white">Mühlespiel-Regeln</h3>
                  <p className="text-xs text-stone-400">Das klassische Strategie-Brettspiel</p>
                </div>
              </div>
              <button
                id="close-rules"
                onClick={onClose}
                className="p-1 px-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-300 text-sm leading-relaxed">
              {/* Introduction */}
              <div className="bg-stone-800/40 border border-stone-800 p-4 rounded-xl flex gap-3">
                <Info className="w-6 h-6 shrink-0" style={{ color: accentColor }} />
                <p>
                  Mühle ist eines der ältesten und beliebtesten Strategie-Brettspiele für zwei Spieler. 
                  Ziel des Spiels ist es, dem Gegner so viele Steine abzunehmen, dass er nur noch zwei besitzt, 
                  oder ihn so zu blockieren, dass er keinen legalen Zug mehr machen kann.
                </p>
              </div>

              {/* Game Phases */}
              <div className="space-y-4">
                <h4 className="font-sans font-bold text-white flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">Phase 1</span>
                  Spielfiguren Setzen (Placing)
                </h4>
                <p className="pl-6 border-l border-stone-800">
                  Beide Spieler setzen abwechselnd je einen Stein auf die freien Kreuzungspunkte des Spielfelds. 
                  In dieser Phase hat jeder Spieler insgesamt <strong>9 Steine</strong> zur Verfügung. 
                  Es können bereits Mühlen gebildet und gegnerische Steine geschlagen werden.
                </p>

                <h4 className="font-sans font-bold text-white flex items-center gap-2 pt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-500">Phase 2</span>
                  Spielfiguren Ziehen (Moving)
                </h4>
                <p className="pl-6 border-l border-stone-800">
                  Wenn alle 18 Steine gesetzt sind, wechseln die Spieler in die Bewegungsphase. 
                  Du darfst abwechselnd einen deiner Steine entlang der eingezeichneten Linien auf einen 
                  direkt benachbarten, freien Kreuzungspunkt bewegen.
                </p>

                <h4 className="font-sans font-bold text-white flex items-center gap-2 pt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">Phase 3</span>
                  Freies Springen (Flying)
                </h4>
                <p className="pl-6 border-l border-stone-800">
                  Sobald ein Spieler nur noch genau <strong>3 Steine</strong> auf dem Brett hat, wechselt dieser Spieler 
                  in die Sprungphase. Seine Steine sind nun frei und dürfen auf <em>jeden beliebigen freien Punkt</em> 
                  des Brettes springen, ohne an Linien oder Nachbarpunkte gebunden zu sein.
                </p>
              </div>

              {/* Rules of forming a Mill */}
              <div className="pt-2 space-y-3">
                <h4 className="font-sans font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Was ist eine Mühle?
                </h4>
                <p>
                  Eine Mühle besteht aus <strong>drei eigenen Steinen auf einer geraden Linie</strong>. 
                  Immer wenn du eine Mühle bildest (durch Setzen, Ziehen oder Springen), darfst du sofort 
                  einen gegnerischen Stein vom Spielfeld entfernen.
                </p>
                <div className="bg-stone-950/40 p-4 border border-stone-800/80 rounded-xl space-y-2 text-xs">
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <p>Du kannst frei entscheiden, welcher gegnerische Stein entfernt wird.</p>
                  </div>
                  <div className="flex gap-2 text-stone-400">
                    <span className="text-rose-500 font-bold">✗</span>
                    <p>
                      <strong>Schutzregel:</strong> Ein gegnerischer Stein, der sich bereits in einer aktiven Mühle befindet, 
                      ist geschützt und darf <em>nicht</em> entfernt werden. Eine Ausnahme gibt es nur, wenn der Gegner 
                      ausschließlich Steine besitzt, die in Mühlen geschützt sind.
                    </p>
                  </div>
                </div>
              </div>

              {/* End of Game */}
              <div className="pt-2 space-y-2">
                <h4 className="font-sans font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Wie gewinnt man?
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Der Gegner hat nur noch <strong>weniger als 3 Steine</strong> auf dem Brett (er kann keine Mühle mehr machen).</li>
                  <li>Der Gegner ist an der Reihe, ist aber komplett eingekesselt und hat <strong>keinen legalen Zug</strong> mehr.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/70 text-right">
              <button
                id="close-rules-btn"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-stone-700 hover:bg-stone-600 font-sans text-white transition-all shadow-md focus:outline-none"
              >
                Verstanden, LOS GEHTS!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
