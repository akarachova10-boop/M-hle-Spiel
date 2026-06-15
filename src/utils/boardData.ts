/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position } from '../types';

export const BOARD_POSITIONS: Position[] = [
  // Outer Square (Ring 0)
  { id: 0, ring: 0, index: 0, label: 'A7', x: 10, y: 10 },
  { id: 1, ring: 0, index: 1, label: 'D7', x: 50, y: 10 },
  { id: 2, ring: 0, index: 2, label: 'G7', x: 90, y: 10 },
  { id: 3, ring: 0, index: 3, label: 'G4', x: 90, y: 50 },
  { id: 4, ring: 0, index: 4, label: 'G1', x: 90, y: 90 },
  { id: 5, ring: 0, index: 5, label: 'D1', x: 50, y: 90 },
  { id: 6, ring: 0, index: 6, label: 'A1', x: 10, y: 90 },
  { id: 7, ring: 0, index: 7, label: 'A4', x: 10, y: 50 },

  // Middle Square (Ring 1)
  { id: 8, ring: 1, index: 0, label: 'B6', x: 25, y: 25 },
  { id: 9, ring: 1, index: 1, label: 'D6', x: 50, y: 25 },
  { id: 10, ring: 1, index: 2, label: 'F6', x: 75, y: 25 },
  { id: 11, ring: 1, index: 3, label: 'F4', x: 75, y: 50 },
  { id: 12, ring: 1, index: 4, label: 'F2', x: 75, y: 75 },
  { id: 13, ring: 1, index: 5, label: 'D2', x: 50, y: 75 },
  { id: 14, ring: 1, index: 6, label: 'B2', x: 25, y: 75 },
  { id: 15, ring: 1, index: 7, label: 'B4', x: 25, y: 50 },

  // Inner Square (Ring 2)
  { id: 16, ring: 2, index: 0, label: 'C5', x: 38, y: 38 },
  { id: 17, ring: 2, index: 1, label: 'D5', x: 50, y: 38 },
  { id: 18, ring: 2, index: 2, label: 'E5', x: 62, y: 38 },
  { id: 19, ring: 2, index: 3, label: 'E4', x: 62, y: 50 },
  { id: 20, ring: 2, index: 4, label: 'E3', x: 62, y: 62 },
  { id: 21, ring: 2, index: 5, label: 'D3', x: 50, y: 62 },
  { id: 22, ring: 2, index: 6, label: 'C3', x: 38, y: 62 },
  { id: 23, ring: 2, index: 7, label: 'C4', x: 38, y: 50 },
];

export const BOARD_CONNECTIONS: [number, number][] = [
  // Ring 0 lines
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  // Ring 1 lines
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  // Ring 2 lines
  [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
  // Midpoint crossings
  [1, 9], [9, 17],
  [3, 11], [11, 19],
  [5, 13], [13, 21],
  [7, 15], [15, 23]
];

export const ADJACENCY_LIST: { [key: number]: number[] } = {
  0: [1, 7],
  1: [0, 2, 9],
  2: [1, 3],
  3: [2, 4, 11],
  4: [3, 5],
  5: [4, 6, 13],
  6: [5, 7],
  7: [6, 0, 15],

  8: [9, 15],
  9: [8, 10, 1, 17],
  10: [9, 11],
  11: [10, 12, 3, 19],
  12: [11, 13],
  13: [12, 14, 5, 21],
  14: [13, 15],
  15: [14, 8, 7, 23],

  16: [17, 23],
  17: [16, 18, 9],
  18: [17, 19],
  19: [18, 20, 11],
  20: [19, 21],
  21: [20, 22, 13],
  22: [21, 23],
  23: [22, 16, 15],
};

export const MILLS: number[][] = [
  // Ring 0 Mills
  [0, 1, 2],
  [2, 3, 4],
  [4, 5, 6],
  [6, 7, 0],

  // Ring 1 Mills
  [8, 9, 10],
  [10, 11, 12],
  [12, 13, 14],
  [14, 15, 8],

  // Ring 2 Mills
  [16, 17, 18],
  [18, 19, 20],
  [20, 21, 22],
  [22, 23, 16],

  // Midpoint crossing Mills
  [1, 9, 17],
  [3, 11, 19],
  [5, 13, 21],
  [7, 15, 23]
];

export function getAdjacentPositions(id: number): number[] {
  return ADJACENCY_LIST[id] || [];
}
