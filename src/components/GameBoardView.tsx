/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppTheme, BoardState, Player, Position } from '../types';
import { BOARD_POSITIONS, getAdjacentPositions } from '../utils/boardData';

interface GameBoardViewProps {
  board: BoardState;
  currentPlayer: Player;
  currentTheme: AppTheme;
  selectedPieceId: number | null;
  validTargets: number[];
  millRemovalTriggered: boolean;
  onPositionClick: (posId: number) => void;
  validRemoveTargets: number[];
}

export default function GameBoardView({
  board,
  currentPlayer,
  currentTheme,
  selectedPieceId,
  validTargets,
  millRemovalTriggered,
  onPositionClick,
  validRemoveTargets,
}: GameBoardViewProps) {
  return (
    <div
      id="muehle-board-wrapper"
      className="w-full aspect-square relative select-none rounded-2xl overflow-hidden p-[4%] md:p-[5%] transition-all duration-500 shadow-2xl"
      style={{
        backgroundColor: currentTheme.boardBg,
        boxShadow: currentTheme.id === 'natural-tones' || currentTheme.id === 'modern-bauhaus'
          ? 'inset 0 0 20px rgba(140,132,121,0.08), 0 10px 30px rgba(140,132,121,0.12)'
          : 'inset 0 0 40px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.4)'
      }}
    >
      {/* Background Board details */}
      <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay">
        {/* Subtle geometric wood-grain or digital grit matrix depending on theme */}
        <div className="w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Main SVG Coordinate Canvas */}
      <svg
        id="muehle-board-svg"
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
      >
        {/* Board Lines */}
        {/* Outer Rect */}
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Middle Rect */}
        <rect
          x="25"
          y="25"
          width="50"
          height="50"
          fill="none"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Inner Rect */}
        <rect
          x="38"
          y="38"
          width="24"
          height="24"
          fill="none"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Crossing Midpoint Bridges */}
        {/* Top bridge */}
        <line
          x1="50"
          y1="10"
          x2="50"
          y2="38"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
        />
        {/* Right bridge */}
        <line
          x1="62"
          y1="50"
          x2="90"
          y2="50"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
        />
        {/* Bottom bridge */}
        <line
          x1="50"
          y1="62"
          x2="50"
          y2="90"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
        />
        {/* Left bridge */}
        <line
          x1="10"
          y1="50"
          x2="38"
          y2="50"
          stroke={currentTheme.boardLines}
          strokeWidth="1.2"
        />

        {/* Render Connection nodes / intersection click spots */}
        {BOARD_POSITIONS.map((pos) => {
          const occupant = board[pos.id];
          const isSelected = selectedPieceId === pos.id;
          const isValidTarget = validTargets.includes(pos.id);
          const isRemovableNode = millRemovalTriggered && validRemoveTargets.includes(pos.id);

          // Node click handler
          const handleClick = () => {
            onPositionClick(pos.id);
          };

          return (
            <g
              key={pos.id}
              onClick={handleClick}
              className="cursor-pointer group select-none"
              style={{ outline: 'none' }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }}
            >
              {/* Interactive larger collision circle for easy clicking on mobile */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill="transparent"
                className="peer"
              />

              {/* Base Point dot if spot is empty */}
              {!occupant && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2"
                  className="transition-all duration-300"
                  fill={isValidTarget ? currentTheme.boardPointsActive : currentTheme.boardPoints}
                  stroke={isValidTarget ? '#fbbf24' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={isValidTarget ? '0.6' : '0.2'}
                  style={{
                    filter: isValidTarget ? `drop-shadow(0 0 4px #fbbf24)` : 'none'
                  }}
                />
              )}

              {/* Golden pulsing target beacon for valid movement destinations */}
              {isValidTarget && !occupant && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="1.8"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.4"
                  className="animate-ping origin-center"
                  style={{ animationDuration: '2s' }}
                />
              )}

              {/* Removable Target highlight overlay (flashing red ring around opponent's pieces) */}
              {isRemovableNode && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2.0"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.6"
                  className="animate-pulse"
                />
              )}

              {/* Pulsing selection circle glow background under white/black piece */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2.0"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.6"
                  className="animate-pulse"
                />
              )}

              {/* Visual piece puck if spot is occupied */}
              {occupant && (
                <foreignObject
                  x={pos.x - 4.5}
                  y={pos.y - 4.5}
                  width="9"
                  height="9"
                  className="overflow-visible pointer-events-none"
                >
                  <div
                    className={`w-[9px] h-[9px] scale-[1.1] origin-center rounded-full transition-all duration-300 flex items-center justify-center ${
                      occupant === 'PLAYER' ? currentTheme.playerPiece : currentTheme.computerPiece
                    } ${
                      isSelected ? 'ring-2 ring-amber-400 rotate-6 scale-[1.3]' : ''
                    }`}
                    style={{
                      transformBox: 'fill-box',
                    }}
                  >
                    {/* Inner 3D concentric details for standard physical checkers styling */}
                    <div className="w-[60%] h-[60%] rounded-full border border-black/10 flex items-center justify-center bg-black/5">
                      <div className="w-[50%] h-[50%] rounded-full bg-white/10" />
                    </div>
                  </div>
                </foreignObject>
              )}

              {/* Floating ID/Label on hover helper (Classic Wooden board / Bauhaus Coordinates) */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <rect
                  x={pos.x - 3.5}
                  y={pos.y - 7.5}
                  width="7"
                  height="3.5"
                  rx="0.8"
                  fill="rgba(0,0,0,0.8)"
                />
                <text
                  x={pos.x}
                  y={pos.y - 5}
                  fill="#ffffff"
                  fontSize="2"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {pos.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
