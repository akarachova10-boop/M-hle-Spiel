/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Player = 'PLAYER' | 'COMPUTER';

export type GamePhase = 'PLACING' | 'MOVING' | 'FLYING' | 'MILL_REMOVE' | 'GAME_OVER';

export interface Position {
  id: number;
  ring: number;      // 0 = Outer, 1 = Middle, 2 = Inner
  index: number;     // 0-7 clockwise from top-left
  label: string;
  x: number;         // percentage x on a coordinate grid (0-100)
  y: number;         // percentage y on a coordinate grid (0-100)
}

export type BoardState = {
  [key: number]: Player | null; // node ID -> Player or null
};

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface MatchRecord {
  id: string;
  date: string;
  winner: Player | 'DRAW';
  turnsCount: number;
  difficulty: Difficulty;
  themeId: string;
  durationSeconds: number;
}

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  phase: GamePhase;
  playerPiecesToPlace: number; // starts at 9
  computerPiecesToPlace: number; // starts at 9
  playerPiecesOnBoard: number;
  computerPiecesOnBoard: number;
  millRemovalTriggeredBy: Player | null; // who formed a mill and has to remove an opponent piece
  selectedPieceId: number | null; // for moving/flying phase
  isAILinking: boolean; // if AI is currently "thinking"
  gameStartedAt: number;
}

export interface AppTheme {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bgClass: string;
  boardBg: string;
  boardLines: string;
  boardPoints: string;
  boardPointsActive: string;
  playerPiece: string;
  computerPiece: string;
  playerPiecePulse: string;
  computerPiecePulse: string;
  sidebarBg: string;
  textMuted: string;
  textPrimary: string;
  buttonPrimary: string;
  accentGlow: string;
}
