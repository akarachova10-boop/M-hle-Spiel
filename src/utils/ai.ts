/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoardState, Player, Difficulty } from '../types';
import { MILLS, ADJACENCY_LIST, getAdjacentPositions, BOARD_POSITIONS } from './boardData';

/**
 * Checks if a specific position is currently part of any completed Mill for a given player.
 */
export function isInsideMill(board: BoardState, player: Player, posId: number): boolean {
  if (board[posId] !== player) return false;

  // Search through all mills that include this position
  for (const mill of MILLS) {
    if (mill.includes(posId)) {
      // If all three spots in the mill are owned by this player, it is an active mill!
      if (board[mill[0]] === player && board[mill[1]] === player && board[mill[2]] === player) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get all player piece positions that can be legally removed.
 * Rule: You cannot remove a piece that is in a mill, UNLESS all pieces are in mills.
 */
export function getValidRemoveTargets(board: BoardState, targetPlayer: Player): number[] {
  const allTargets: number[] = [];
  const millTargets: number[] = [];
  const nonMillTargets: number[] = [];

  for (const posIdStr in board) {
    const posId = parseInt(posIdStr, 10);
    if (board[posId] === targetPlayer) {
      allTargets.push(posId);
      if (isInsideMill(board, targetPlayer, posId)) {
        millTargets.push(posId);
      } else {
        nonMillTargets.push(posId);
      }
    }
  }

  // If all pieces are inside a mill, any of them can be removed.
  // Otherwise, only the ones outside mills can be removed.
  return nonMillTargets.length > 0 ? nonMillTargets : millTargets;
}

/**
 * Gets all vacant positions on the board.
 */
export function getEmptyPositions(board: BoardState): number[] {
  const empty: number[] = [];
  for (let i = 0; i < 24; i++) {
    if (!board[i]) {
      empty.push(i);
    }
  }
  return empty;
}

/**
 * Checks if a player has any legal moves available.
 * If a player has no pieces to place and cannot move any of their pieces on the board, they lose.
 */
export function hasLegalMoves(board: BoardState, player: Player, totalPiecesOnBoard: number): boolean {
  // If the player can "fly" (3 pieces left), they can move anywhere, so they always have a legal move if there is an empty space.
  const empty = getEmptyPositions(board);
  if (empty.length === 0) return false;

  if (totalPiecesOnBoard <= 3) return true;

  // Otherwise, check if at least one piece of the player has an adjacent space that is empty.
  for (const posIdStr in board) {
    const posId = parseInt(posIdStr, 10);
    if (board[posId] === player) {
      const neighbors = getAdjacentPositions(posId);
      for (const n of neighbors) {
        if (!board[n]) return true; // Found a valid adjacent move
      }
    }
  }

  return false;
}

/**
 * AI Decision Maker
 */
export class MuehleAI {
  /**
   * Helper to check if placing a piece at 'pos' makes a Mill for 'player'.
   */
  private wouldFormMill(board: BoardState, player: Player, pos: number): boolean {
    // Clone board state temporarily
    const tempBoard = { ...board, [pos]: player };
    return isInsideMill(tempBoard, player, pos);
  }

  /**
   * Finds any position where placing a piece completes a Mill for 'player'.
   */
  private findMillCompletionSpot(board: BoardState, player: Player): number | null {
    const emptySpots = getEmptyPositions(board);
    for (const spot of emptySpots) {
      if (this.wouldFormMill(board, player, spot)) {
        return spot;
      }
    }
    return null;
  }

  /**
   * Evaluates and scores position strategically
   */
  private scorePlacingPosition(board: BoardState, pos: number, player: Player): number {
    let score = 0;

    // Check connections
    const neighbors = getAdjacentPositions(pos);
    score += neighbors.length * 2; // Midpoints usually have higher mobility (3 or 4 neighbors)

    // Middle Ring midpoints (9, 11, 13, 15) are extremely strategic because they connect outward and inward
    if ([9, 11, 13, 15].includes(pos)) {
      score += 5;
    }

    // Check if placing here sets up an future mill (2 out of 3 of our color)
    for (const mill of MILLS) {
      if (mill.includes(pos)) {
        const ownedCount = mill.filter(p => board[p] === player).length;
        const emptyCount = mill.filter(p => !board[p]).length;
        if (ownedCount === 1 && emptyCount === 2) {
          score += 4; // Nice setup spot
        }
      }
    }

    return score;
  }

  /**
   * 1. Decides which position to PLACE a piece.
   */
  public selectPlacingMove(board: BoardState, difficulty: Difficulty): number {
    const emptyPositions = getEmptyPositions(board);
    if (emptyPositions.length === 0) return -1;

    // Helper: Pick a random item from array
    const pickRandom = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];

    // EASY Difficulty: High randomness, only complete mills or blocks occasionally
    if (difficulty === 'EASY') {
      const roll = Math.random();
      if (roll > 0.3) {
        // 70% chance of random placement
        return pickRandom(emptyPositions);
      }
    }

    // 1. Can we make a mill right now?
    const myMillSpot = this.findMillCompletionSpot(board, 'COMPUTER');
    if (myMillSpot !== null) return myMillSpot;

    // 2. Can we block the player's mill?
    const blockSpot = this.findMillCompletionSpot(board, 'PLAYER');
    if (blockSpot !== null) return blockSpot;

    if (difficulty === 'MEDIUM') {
      const roll = Math.random();
      if (roll > 0.6) {
        // 40% random move
        return pickRandom(emptyPositions);
      }
    }

    // 3. Strategic scoring
    let bestSpot = emptyPositions[0];
    let maxScore = -999;

    for (const spot of emptyPositions) {
      const sc = this.scorePlacingPosition(board, spot, 'COMPUTER');
      if (sc > maxScore) {
        maxScore = sc;
        bestSpot = spot;
      }
    }

    return bestSpot;
  }

  /**
   * 2. Decides which piece to MOVE or FLY, and to which target position.
   * Returns: { fromId: number, toId: number } | null
   */
  public selectMovementMove(
    board: BoardState,
    difficulty: Difficulty,
    piecesCount: number // computer pieces count on board
  ): { fromId: number, toId: number } | null {
    const isFlying = piecesCount === 3;
    const moves: { fromId: number, toId: number, score: number }[] = [];

    // Find all legal moves
    for (const fromIdStr in board) {
      const fromId = parseInt(fromIdStr, 10);
      if (board[fromId] !== 'COMPUTER') continue;

      const targets = isFlying ? getEmptyPositions(board) : getAdjacentPositions(fromId).filter(n => !board[n]);

      for (const toId of targets) {
        // Calculate score
        let score = 0;

        // Temporary board stimulation
        const simulatedBoard: BoardState = { ...board, [fromId]: null, [toId]: 'COMPUTER' };

        // 1. Does it close a Mill?
        if (isInsideMill(simulatedBoard, 'COMPUTER', toId)) {
          score += 100; // Extremely high priority!
        }

        // 2. Does it block a player's prospective mill?
        // Check if player had a mill configuration and moving here blocks them
        const playerMillSpot = this.findMillCompletionSpot(board, 'PLAYER');
        if (playerMillSpot === toId) {
          score += 40; // Block opponent mill
        }

        // 3. Does it break an existing computer Mill?
        // Breaking a mill can actually be good if done strategically to close it again (Zwickmühle),
        // but generally we avoid breaking unless it lets us close it or there's no choice.
        if (isInsideMill(board, 'COMPUTER', fromId)) {
          score -= 15; // penalize breaking an existing mill slightly unless it accomplishes a new mill
        }

        // 4. Strategic position of the target slot
        if ([9, 11, 13, 15].includes(toId)) {
          score += 5; // Control junctions
        }

        // 5. Setup potential for next round
        for (const mill of MILLS) {
          if (mill.includes(toId)) {
            const owned = mill.filter(p => simulatedBoard[p] === 'COMPUTER').length;
            const empty = mill.filter(p => !simulatedBoard[p]).length;
            if (owned === 2 && empty === 1) {
              score += 10; // Great setup
            }
          }
        }

        moves.push({ fromId, toId, score });
      }
    }

    if (moves.length === 0) return null;

    // Pick move based on difficulty
    if (difficulty === 'EASY') {
      // Pick a random legal move
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 'MEDIUM') {
      // 30% chance of a random legal move, 70% best move
      if (Math.random() > 0.7) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    }

    // Sort moves by score descending
    moves.sort((a, b) => b.score - a.score);
    return moves[0];
  }

  /**
   * 3. Decides which PLAYER piece to remove when Computer forms a Mill.
   */
  public selectRemovalTarget(board: BoardState, difficulty: Difficulty): number {
    const validTargets = getValidRemoveTargets(board, 'PLAYER');
    if (validTargets.length === 0) return -1;

    if (difficulty === 'EASY') {
      return validTargets[Math.floor(Math.random() * validTargets.length)];
    }

    // Heuristic: Remove the piece that is most dangerous (part of a mill setup)
    let bestTarget = validTargets[0];
    let maxRisk = -1;

    for (const target of validTargets) {
      let risk = 0;

      // Check if this piece is close to making a mill for the player
      for (const mill of MILLS) {
        if (mill.includes(target)) {
          const playerPieces = mill.filter(p => board[p] === 'PLAYER').length;
          const emptyPieces = mill.filter(p => !board[p]).length;
          if (playerPieces === 2 && emptyPieces === 1) {
            risk += 15; // High priority block!
          }
        }
      }

      // Check mobility of this target
      const neighbors = getAdjacentPositions(target);
      const freeNeighbors = neighbors.filter(n => !board[n]);
      risk += freeNeighbors.length * 2;

      // Middle ring control
      if ([9, 11, 13, 15].includes(target)) {
        risk += 4;
      }

      if (risk > maxRisk) {
        maxRisk = risk;
        bestTarget = target;
      }
    }

    if (difficulty === 'MEDIUM' && Math.random() > 0.7) {
      return validTargets[Math.floor(Math.random() * validTargets.length)];
    }

    return bestTarget;
  }
}
