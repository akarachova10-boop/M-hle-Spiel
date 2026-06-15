/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Cpu,
  User,
  Hash,
  Sparkles,
  Award,
  Clock,
  History,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

import {
  Player,
  GamePhase,
  Difficulty,
  MatchRecord,
  BoardState,
  AppTheme,
  GameState,
} from './types';
import { APP_THEMES } from './utils/themes';
import { BOARD_POSITIONS, getAdjacentPositions } from './utils/boardData';
import {
  isInsideMill,
  getValidRemoveTargets,
  getEmptyPositions,
  hasLegalMoves,
  MuehleAI,
} from './utils/ai';

import GameBoardView from './components/GameBoardView';
import ThemeSelector from './components/ThemeSelector';
import GameStats from './components/GameStats';
import RulesModal from './components/RulesModal';

// Initial empty board state creator
const createEmptyBoard = (): BoardState => {
  const b: BoardState = {};
  for (let i = 0; i < 24; i++) {
    b[i] = null;
  }
  return b;
};

// Initial state of a round
const getInitialGameState = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: 'PLAYER',
  phase: 'PLACING',
  playerPiecesToPlace: 9,
  computerPiecesToPlace: 9,
  playerPiecesOnBoard: 0,
  computerPiecesOnBoard: 0,
  millRemovalTriggeredBy: null,
  selectedPieceId: null,
  isAILinking: false,
  gameStartedAt: Date.now(),
});

export default function App() {
  // --- STATE DECLARATIONS ---
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(APP_THEMES[0]);
  const [records, setRecords] = useState<MatchRecord[]>([]);

  // UI Tabs and Auxiliaries
  const [activeTab, setActiveTab] = useState<'play' | 'themes' | 'stats'>('play');
  const [showRules, setShowRules] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [eventLogs, setEventLogs] = useState<string[]>(['Willkommen beim Mühlespiel!', 'Phase 1: Setze deine ersten Steine.']);

  // Match Duration State
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const aiInstance = useRef(new MuehleAI());

  // --- PERSISTENCE: LOAD ON MOUNT ---
  useEffect(() => {
    // 1. Load Match Records
    const savedRecords = localStorage.getItem('muehle_records_2026');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error('Error loading records', e);
      }
    }

    // 2. Load Selected Theme
    const savedThemeId = localStorage.getItem('muehle_theme_id');
    if (savedThemeId) {
      const match = APP_THEMES.find((t) => t.id === savedThemeId);
      if (match) setCurrentTheme(match);
    }

    // 3. Load Difficulty
    const savedDifficulty = localStorage.getItem('muehle_difficulty');
    if (savedDifficulty) {
      setDifficulty(savedDifficulty as Difficulty);
    }

    // 4. Load Active Game State if exists
    const savedActiveGame = localStorage.getItem('muehle_active_game');
    if (savedActiveGame) {
      try {
        const parsed = JSON.parse(savedActiveGame);
        // Ensure starting timestamp is set
        if (!parsed.gameStartedAt) parsed.gameStartedAt = Date.now();
        setGameState(parsed);

        // Load corresponding logs
        const savedLogs = localStorage.getItem('muehle_logs');
        if (savedLogs) {
          setEventLogs(JSON.parse(savedLogs));
        }
      } catch (e) {
        console.error('Error restoring active game state', e);
      }
    }
  }, []);

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (gameState.phase !== 'GAME_OVER' && !isPaused) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.phase, isPaused]);

  // Reset clock when a new game starts
  useEffect(() => {
    if (gameState.board && Object.values(gameState.board).every(v => v === null)) {
      setSecondsElapsed(0);
    }
  }, [gameState.board]);

  // Turn Timer effect to track 30 seconds for each move/decision
  useEffect(() => {
    if (gameState.phase === 'GAME_OVER') {
      return;
    }
    setTurnSecondsLeft(30);
  }, [gameState.currentPlayer, gameState.phase]);

  useEffect(() => {
    if (gameState.phase === 'GAME_OVER' || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTurnSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (gameState.currentPlayer === 'PLAYER') {
            handleEndGame('COMPUTER', ['Zeit abgelaufen! Du hast die 30 Sekunden Bedenkzeit überschritten.']);
          } else {
            handleEndGame('PLAYER', ['Zeit abgelaufen! Der Computer hat zu lange überlegt.']);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.currentPlayer, gameState.phase, isPaused]);

  // --- PERSISTENCE: SAVE ON GAME STUFF MODIFICATION ---
  const saveActiveGameToLocalStorage = (state: GameState, logs: string[]) => {
    localStorage.setItem('muehle_active_game', JSON.stringify(state));
    localStorage.setItem('muehle_logs', JSON.stringify(logs));
  };

  const clearActiveGameFromLocalStorage = () => {
    localStorage.removeItem('muehle_active_game');
    localStorage.removeItem('muehle_logs');
  };

  // Switch Theme & Save
  const handleSelectTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('muehle_theme_id', theme.id);
    addLog(`Design gewechselt zu: ${theme.name}`);
  };

  // Switch Difficulty & Save
  const handleSelectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    localStorage.setItem('muehle_difficulty', diff);
    addLog(`Schwierigkeit geändert auf: ${getDifficultyLabel(diff)}`);
  };

  // Clear historic match records
  const handleClearStats = () => {
    setRecords([]);
    localStorage.setItem('muehle_records_2026', JSON.stringify([]));
    addLog('Statistiken und Spielverlauf zurückgesetzt.');
  };

  // Helper labels in German
  const getDifficultyLabel = (diff: Difficulty): string => {
    switch (diff) {
      case 'EASY':
        return 'Leicht (Hobby-Gegner)';
      case 'MEDIUM':
        return 'Mittel (Fortgeschritten)';
      case 'HARD':
        return 'Schwer (Profi-Stratege)';
    }
  };

  // --- SOUND EFFECTS ---
  // Simple synthesizers to run client-side without external asset loading crashes
  const playSound = (type: 'place' | 'move' | 'mill' | 'win' | 'lose' | 'select') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'place') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'move') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'mill') {
        // High alert gold arpeggio!
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'win') {
        // Glorious fanfare !
        osc.type = 'sine';
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscNode.type = 'sawtooth';
          oscNode.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
          oscNode.start(ctx.currentTime + i * 0.12);
          oscNode.stop(ctx.currentTime + i * 0.12 + 0.4);
        });
      } else if (type === 'lose') {
        // Sad trombone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(146.83, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }
    } catch (err) {
      console.warn('Audio synthesis failed or blocked by autoplay constraints');
    }
  };

  // --- Helper to append transaction logs ---
  const addLog = (msg: string) => {
    setEventLogs((prev) => {
      const updated = [msg, ...prev].slice(0, 30); // keep last 30 logs
      return updated;
    });
  };

  // Derive active sizes
  const countPiecesOnBoard = (board: BoardState, player: Player): number => {
    return Object.values(board).filter((p) => p === player).length;
  };

  const getPositionLabel = (id: number): string => {
    const p = BOARD_POSITIONS.find((node) => node.id === id);
    return p ? p.label : `#${id}`;
  };

  // --- MASTER STATE UPDATE WRAPPER ---
  const updateGameAndPersist = (newState: GameState, currentLogs: string[]) => {
    setGameState(newState);
    saveActiveGameToLocalStorage(newState, currentLogs);
  };

  // --- ACTIONS ---

  // Starts a fresh clean round
  const handleStartNewGame = () => {
    const freshState = getInitialGameState();
    const freshLogs = ['Neues Mühlespiel gestartet!', 'Setze abwechselnd deine Steine (Phase 1).'];
    setGameState(freshState);
    setEventLogs(freshLogs);
    setSecondsElapsed(0);
    setIsPaused(false);
    clearActiveGameFromLocalStorage();
    playSound('select');
  };

  // Renders game rules helper
  const handleToggleRules = () => {
    setShowRules(!showRules);
  };

  // --- USER INTERACTION LOGIC (Click Handling) ---
  const handlePositionClick = (posId: number) => {
    // Break early if it isn't human's turn, if AI is calculating, if the game is over, or if paused
    if (gameState.currentPlayer !== 'PLAYER' || gameState.isAILinking || gameState.phase === 'GAME_OVER' || isPaused) {
      return;
    }

    const currentOccupant = gameState.board[posId];

    // 1. PLACING Phase Turn
    if (gameState.phase === 'PLACING') {
      if (currentOccupant !== null) {
        addLog('Dieser Platz ist bereits besetzt!');
        return;
      }

      // Execute Place
      const updatedBoard = { ...gameState.board, [posId]: 'PLAYER' as Player };
      const nextToPlace = gameState.playerPiecesToPlace - 1;
      const onBoard = countPiecesOnBoard(updatedBoard, 'PLAYER');
      const compOnBoard = countPiecesOnBoard(updatedBoard, 'COMPUTER');

      playSound('place');
      const label = getPositionLabel(posId);
      const logMsg = `Spieler setzt Stein auf ${label}.`;
      const nextLogs = [logMsg, ...eventLogs];
      setEventLogs(nextLogs);

      // Check if this formed a Mill!
      const formedMill = isInsideMill(updatedBoard, 'PLAYER', posId);

      let nextPhase: GamePhase = 'PLACING';
      let nextPlayer: Player = 'PLAYER';
      let millTrigger: Player | null = null;

      if (formedMill) {
        playSound('mill');
        nextPhase = 'MILL_REMOVE';
        millTrigger = 'PLAYER';
        nextPlayer = 'PLAYER'; // Keep player for piece removal
        addLog(`MÜHLE! Du hast eine Mühle gebildet auf ${label}! Wähle einen gegnerischen Stein zum Schlagen.`);
      } else {
        // If placing turns finished
        if (nextToPlace === 0 && gameState.computerPiecesToPlace === 0) {
          nextPhase = 'MOVING';
          addLog('Placing abgeschlossen. Alle Figuren stehen! Phase 2: Bewege deine Steine.');
        }

        nextPlayer = 'COMPUTER'; // Switch to AI
      }

      const nextState: GameState = {
        ...gameState,
        board: updatedBoard,
        playerPiecesToPlace: nextToPlace,
        playerPiecesOnBoard: onBoard,
        computerPiecesOnBoard: compOnBoard,
        phase: nextPhase,
        millRemovalTriggeredBy: millTrigger,
        currentPlayer: nextPlayer,
      };

      updateGameAndPersist(nextState, nextLogs);

      // Trigger computer turn if applicable
      if (nextPlayer === 'COMPUTER') {
        triggerAILogic(nextState, nextLogs);
      }
      return;
    }

    // 2. MILL REMOVAL PHASE (Active Player selecting Computer piece to remove)
    if (gameState.phase === 'MILL_REMOVE' && gameState.millRemovalTriggeredBy === 'PLAYER') {
      if (currentOccupant !== 'COMPUTER') {
        addLog('Wähle eine gegnerische (schwarze/gelbe) Figur zum Entfernen!');
        return;
      }

      const validTargets = getValidRemoveTargets(gameState.board, 'COMPUTER');
      if (!validTargets.includes(posId)) {
        addLog('Schutzregel: Du darfst keine Figur aus einer bestehenden gegnerischen Mühle schlagen, solange es freie Figuren gibt!');
        return;
      }

      // Execute remove
      const updatedBoard = { ...gameState.board, [posId]: null };
      const compRemainingOnBoard = countPiecesOnBoard(updatedBoard, 'COMPUTER');
      const computerTotal = compRemainingOnBoard + gameState.computerPiecesToPlace;

      playSound('place');
      const label = getPositionLabel(posId);
      const logMsg = `Spieler entfernt gegnerischen Stein auf ${label}.`;
      const nextLogs = [logMsg, ...eventLogs];
      setEventLogs(nextLogs);

      // Check if computer lost (< 3 pieces and no placing left)
      const hasPlacedAll = gameState.computerPiecesToPlace === 0 && gameState.playerPiecesToPlace === 0;

      let nextPhase: GamePhase = hasPlacedAll ? 'MOVING' : 'PLACING';
      let nextPlayer: Player = 'COMPUTER';

      if (hasPlacedAll && computerTotal < 3) {
        // Player wins
        handleEndGame('PLAYER', nextLogs);
        return;
      }

      // Overwrite phase if currently moving or flying
      const playerOnBoard = countPiecesOnBoard(updatedBoard, 'PLAYER');
      const pCount = playerOnBoard + gameState.playerPiecesToPlace;
      const cCount = compRemainingOnBoard + gameState.computerPiecesToPlace;

      if (hasPlacedAll) {
        nextPhase = (pCount === 3) ? 'FLYING' : 'MOVING';
        // Check if AI is blocked and cannot move
        if (!hasLegalMoves(updatedBoard, 'COMPUTER', compRemainingOnBoard)) {
          handleEndGame('PLAYER', [
            'Der Computer ist blockiert und kann sich nicht mehr bewegen.',
            ...nextLogs
          ]);
          return;
        }
      }

      const nextState: GameState = {
        ...gameState,
        board: updatedBoard,
        computerPiecesOnBoard: compRemainingOnBoard,
        phase: nextPhase,
        millRemovalTriggeredBy: null,
        currentPlayer: nextPlayer,
      };

      updateGameAndPersist(nextState, nextLogs);
      triggerAILogic(nextState, nextLogs);
      return;
    }

    // 3. MOVING / FLYING PHASE - SELECTION & MOVEMENT
    if (gameState.phase === 'MOVING' || gameState.phase === 'FLYING') {
      const playerOnBoardCount = countPiecesOnBoard(gameState.board, 'PLAYER');
      const isPlayerFlying = playerOnBoardCount === 3;

      // Classify click action
      if (currentOccupant === 'PLAYER') {
        // SELECT or SWITCH piece to move
        playSound('select');
        const nextState: GameState = {
          ...gameState,
          selectedPieceId: posId,
        };
        updateGameAndPersist(nextState, eventLogs);
        addLog(`Figur auf ${getPositionLabel(posId)} ausgewählt. Wohin soll sie ziehen?`);
        return;
      }

      // Move selected piece if clicking empty target
      if (currentOccupant === null && gameState.selectedPieceId !== null) {
        const fromPos = gameState.selectedPieceId;

        // Is it a valid neighbor in MOVING phase?
        if (!isPlayerFlying && gameState.phase === 'MOVING') {
          const neighbors = getAdjacentPositions(fromPos);
          if (!neighbors.includes(posId)) {
            addLog('Fehler: Du kannst deine Figur nur auf benachbarte freie Felder entlang der Linien ziehen!');
            return;
          }
        }

        // Execute Move
        const updatedBoard = {
          ...gameState.board,
          [fromPos]: null,
          [posId]: 'PLAYER' as Player,
        };

        playSound('move');
        const fromLabel = getPositionLabel(fromPos);
        const toLabel = getPositionLabel(posId);
        const logMsg = `Spieler zieht von ${fromLabel} nach ${toLabel}.`;
        const nextLogs = [logMsg, ...eventLogs];
        setEventLogs(nextLogs);

        // Check if formed Mill
        const formedMill = isInsideMill(updatedBoard, 'PLAYER', posId);

        let nextPhase = gameState.phase;
        let nextPlayer: Player = 'PLAYER';
        let millTrigger: Player | null = null;

        const compOnBoard = countPiecesOnBoard(updatedBoard, 'COMPUTER');
        const myOnBoard = countPiecesOnBoard(updatedBoard, 'PLAYER');

        if (formedMill) {
          playSound('mill');
          nextPhase = 'MILL_REMOVE';
          millTrigger = 'PLAYER';
          nextPlayer = 'PLAYER'; // Player executes removal
          addLog(`MÜHLE formed auf ${toLabel}! Entferne eine gegnerische Figur.`);
        } else {
          // Switch turn to AI
          nextPlayer = 'COMPUTER';

          // Check if AI is blocked and cannot move
          if (!hasLegalMoves(updatedBoard, 'COMPUTER', compOnBoard)) {
            handleEndGame('PLAYER', [
              'Spieler zieht. Der Computer ist eingekesselt und hat keine legalen Züge mehr!',
              ...nextLogs
            ]);
            return;
          }
        }

        // Re-evaluate Flying phase transitions
        let evaluatedPhase = nextPhase;
        if (nextPhase !== 'MILL_REMOVE') {
          // Check if opponent is down to 3 -> opponent flies
          // Check if player is down to 3 -> player flies
          if (myOnBoard === 3) {
            evaluatedPhase = 'FLYING';
          }
        }

        const nextState: GameState = {
          ...gameState,
          board: updatedBoard,
          currentPlayer: nextPlayer,
          selectedPieceId: null,
          phase: evaluatedPhase,
          millRemovalTriggeredBy: millTrigger,
        };

        updateGameAndPersist(nextState, nextLogs);

        if (nextPlayer === 'COMPUTER') {
          triggerAILogic(nextState, nextLogs);
        }
      }
    }
  };

  // --- COMPUTER Turn orchestrator (AI THREAD SIMULATION) ---
  const triggerAILogic = (currentState: GameState, currentLogs: string[]) => {
    // 1. Tag AI activity start
    const loadingState: GameState = {
      ...currentState,
      isAILinking: true,
    };
    setGameState(loadingState);

    // 2. Play thinking timeout to prevent instantaneous AI play (800ms to 1400ms based on difficulty)
    const delay = difficulty === 'HARD' ? 1200 : difficulty === 'MEDIUM' ? 1000 : 800;

    const executeAI = () => {
      if (isPausedRef.current) {
        setTimeout(executeAI, 300);
        return;
      }

      // Create clone structures inside the timeout scope to avoid closure updates
      const innerBoard = { ...loadingState.board };
      let updatedPhase = loadingState.phase;
      let nextPlayer: Player = 'PLAYER';
      let millTrigger: Player | null = null;

      let logsAccumulator = [...currentLogs];

      // --- AI PLACING DECIDED ---
      if (updatedPhase === 'PLACING') {
        const placeSpot = aiInstance.current.selectPlacingMove(innerBoard, difficulty);
        if (placeSpot !== -1) {
          innerBoard[placeSpot] = 'COMPUTER';
          playSound('place');
          const spotLabel = getPositionLabel(placeSpot);
          logsAccumulator = [`Computer setzt Stein auf ${spotLabel}.`, ...logsAccumulator];

          // Check for Mill
          const formedMill = isInsideMill(innerBoard, 'COMPUTER', placeSpot);
          const nextCompPieces = loadingState.computerPiecesToPlace - 1;

          if (formedMill) {
            playSound('mill');
            // Select and remove player piece
            const removeTarget = aiInstance.current.selectRemovalTarget(innerBoard, difficulty);
            if (removeTarget !== -1) {
              innerBoard[removeTarget] = null;
              const victimLabel = getPositionLabel(removeTarget);
              logsAccumulator = [
                `MÜHLE! Computer schlägt deinen Stein auf ${victimLabel}!`,
                ...logsAccumulator
              ];
            }
          }

          // Check if Placing phase ends
          const humanPiecesToPlace = loadingState.playerPiecesToPlace;
          if (nextCompPieces === 0 && humanPiecesToPlace === 0) {
            updatedPhase = 'MOVING';
            logsAccumulator = [
              'Phase 2: Ziehen beginnt! Alle 18 Steine eingebracht.',
              ...logsAccumulator
            ];
          }

          // Compute piece quantities
          const pOnBoard = countPiecesOnBoard(innerBoard, 'PLAYER');
          const cOnBoard = countPiecesOnBoard(innerBoard, 'COMPUTER');

          // Check if player has lost from mill deletion
          if (updatedPhase === 'MOVING' && pOnBoard < 3) {
            setEventLogs(logsAccumulator);
            handleEndGame('COMPUTER', logsAccumulator);
            return;
          }

          const nextState: GameState = {
            ...loadingState,
            board: innerBoard,
            phase: updatedPhase,
            computerPiecesToPlace: nextCompPieces,
            currentPlayer: 'PLAYER',
            isAILinking: false,
            playerPiecesOnBoard: pOnBoard,
            computerPiecesOnBoard: cOnBoard,
          };

          // Check if PLAYER got blocked right after Placing ended
          if (updatedPhase === 'MOVING' && !hasLegalMoves(innerBoard, 'PLAYER', pOnBoard)) {
            setEventLogs(logsAccumulator);
            handleEndGame('COMPUTER', [
              'Keine Züge verbleibend für den Spieler! Computer siegt.',
              ...logsAccumulator
            ]);
            return;
          }

          setEventLogs(logsAccumulator);
          updateGameAndPersist(nextState, logsAccumulator);
          return;
        }
      }

      // --- AI MOVING / FLYING DECIDED ---
      if (updatedPhase === 'MOVING' || updatedPhase === 'FLYING') {
        const compCount = countPiecesOnBoard(innerBoard, 'COMPUTER');
        const moveChoice = aiInstance.current.selectMovementMove(innerBoard, difficulty, compCount);

        if (!moveChoice) {
          // Blocked: Player wins!
          setEventLogs(logsAccumulator);
          handleEndGame('PLAYER', [
            'Der Computer ist blockiert und kann sich nicht mehr bewegen!',
            ...logsAccumulator
          ]);
          return;
        }

        // Execute AI movement
        const fromLabel = getPositionLabel(moveChoice.fromId);
        const toLabel = getPositionLabel(moveChoice.toId);
        innerBoard[moveChoice.fromId] = null;
        innerBoard[moveChoice.toId] = 'COMPUTER';

        playSound('move');
        logsAccumulator = [
          `Computer zieht von ${fromLabel} nach ${toLabel}.`,
          ...logsAccumulator
        ];

        // Check mill
        const formedMill = isInsideMill(innerBoard, 'COMPUTER', moveChoice.toId);
        if (formedMill) {
          playSound('mill');
          const removeTarget = aiInstance.current.selectRemovalTarget(innerBoard, difficulty);
          if (removeTarget !== -1) {
            innerBoard[removeTarget] = null;
            const victimLabel = getPositionLabel(removeTarget);
            logsAccumulator = [
              `MÜHLE! Computer entfernt deinen Stein auf ${victimLabel}!`,
              ...logsAccumulator
            ];
          }
        }

        // Assess quantities
        const finalPOnBoard = countPiecesOnBoard(innerBoard, 'PLAYER');
        const finalCOnBoard = countPiecesOnBoard(innerBoard, 'COMPUTER');

        // Check if player has lost
        if (finalPOnBoard < 3) {
          setEventLogs(logsAccumulator);
          handleEndGame('COMPUTER', logsAccumulator);
          return;
        }

        // Re-evaluate Flying transitions
        let finalPhase = updatedPhase;
        if (finalPOnBoard === 3) {
          finalPhase = 'FLYING';
        }

        // Check if Player is blocked
        if (!hasLegalMoves(innerBoard, 'PLAYER', finalPOnBoard)) {
          setEventLogs(logsAccumulator);
          handleEndGame('COMPUTER', [
            'Du bist komplett eingekesselt und hast keinen gültigen Zug mehr!',
            ...logsAccumulator
          ]);
          return;
        }

        const nextState: GameState = {
          ...loadingState,
          board: innerBoard,
          phase: finalPhase,
          currentPlayer: 'PLAYER',
          isAILinking: false,
          playerPiecesOnBoard: finalPOnBoard,
          computerPiecesOnBoard: finalCOnBoard,
        };

        setEventLogs(logsAccumulator);
        updateGameAndPersist(nextState, logsAccumulator);
      }
    };

    setTimeout(executeAI, delay);
  };

  // --- VICTORY WRAPPER ---
  const handleEndGame = (winnerParty: Player, finalLogsRef: string[]) => {
    playSound(winnerParty === 'PLAYER' ? 'win' : 'lose');

    const duration = Math.round((Date.now() - gameState.gameStartedAt) / 1000);

    const logs = [
      `SPIEL BEENDET! ${winnerParty === 'PLAYER' ? 'DU HAST GEWONNEN! 🎉' : 'Der Computer gewinnt! 🤖'}`,
      ...finalLogsRef
    ];
    setEventLogs(logs);

    // Save Record
    const newRecord: MatchRecord = {
      id: Math.random().toString(36).substring(4),
      date: new Date().toISOString(),
      winner: winnerParty,
      turnsCount: logs.filter((l) => l.includes('zieht von') || l.includes('setzt Stein auf')).length,
      difficulty: difficulty,
      themeId: currentTheme.id,
      durationSeconds: duration > 0 ? duration : secondsElapsed,
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('muehle_records_2026', JSON.stringify(updatedRecords));

    const finalState: GameState = {
      ...gameState,
      phase: 'GAME_OVER',
      currentPlayer: winnerParty, // Winner stays as active
      isAILinking: false,
    };

    setGameState(finalState);
    clearActiveGameFromLocalStorage();
  };

  // --- COMPUTE INTERACTIVE OVERLAYS CODES ---
  const getSubTitleText = (): string => {
    if (gameState.phase === 'GAME_OVER') {
      return gameState.currentPlayer === 'PLAYER' ? 'Du hast gewonnen!' : 'Computer hat gewonnen.';
    }
    if (gameState.phase === 'MILL_REMOVE') {
      return gameState.millRemovalTriggeredBy === 'PLAYER' ? 'Mühle gebildet! Entferne eine gegnerische Figur.' : 'Mühle für den Computer!';
    }
    if (gameState.currentPlayer === 'PLAYER') {
      if (gameState.phase === 'PLACING') {
        return `Platziere deine Figur (${gameState.playerPiecesToPlace} übrig)`;
      }
      if (gameState.phase === 'FLYING') {
        return 'Wähle eine Figur zum freien Fliegen!';
      }
      return 'Bewege eine Figur auf ein benachbartes Feld';
    } else {
      return 'Der Computer überlegt...';
    }
  };

  const getValidTargets = (): number[] => {
    if (gameState.currentPlayer !== 'PLAYER' || gameState.isAILinking || gameState.phase === 'GAME_OVER') {
      return [];
    }

    if (gameState.selectedPieceId !== null) {
      const fromPos = gameState.selectedPieceId;
      const onBoardCount = countPiecesOnBoard(gameState.board, 'PLAYER');

      if (gameState.phase === 'FLYING' || onBoardCount === 3) {
        return getEmptyPositions(gameState.board);
      } else {
        return getAdjacentPositions(fromPos).filter((n) => !gameState.board[n]);
      }
    }
    return [];
  };

  const currentRemoveTargets =
    gameState.phase === 'MILL_REMOVE' && gameState.millRemovalTriggeredBy === 'PLAYER'
      ? getValidRemoveTargets(gameState.board, 'COMPUTER')
      : [];

  const isLightTheme = currentTheme.id === 'natural-tones' || currentTheme.id === 'modern-bauhaus';

  return (
    <div
      id="muehle-app-root"
      className={`min-h-screen py-3 sm:py-4 px-3 sm:px-6 transition-colors duration-500 font-sans flex flex-col justify-between ${currentTheme.bgClass} ${currentTheme.textPrimary}`}
    >
      {/* Container holding top elements */}
      <div className="w-full max-w-5xl mx-auto space-y-4 flex-1">
        {/* Header navigation bar */}
        <header className="flex flex-row items-center justify-between gap-3 pb-2.5 border-b border-current/10">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 sm:p-2 rounded-xl ${currentTheme.sidebarBg} shrink-0 shadow-md border border-current/5`}>
              <Trophy className="w-5 sm:w-6 h-5 sm:h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-sans tracking-tight text-inherit flex items-center gap-1.5 leading-none">
                Mühlespiel
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-current/10 text-inherit font-normal opacity-70">v2.5</span>
              </h1>
              <p className="text-[10px] opacity-70 font-medium mt-1 hidden sm:block">Duelle gegen die KI</p>
            </div>
          </div>

          {/* Action buttons at the top side */}
          <div className="flex items-center gap-1.5">
            {/* Regeln button */}
            <button
              id="rules-btn"
              onClick={handleToggleRules}
              className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-1.5 ${
                isLightTheme ? 'bg-white text-stone-700 border-[#E5E0D8] hover:bg-stone-50' : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
              }`}
              title="Spielregeln anzeigen"
            >
              <BookOpen className="w-3 h-3" />
              <span>Regeln</span>
            </button>

            {/* Ton button */}
            <button
              id="sound-toggle-btn"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                addLog(`Sound ${!soundEnabled ? 'aktiviert' : 'deaktiviert'}`);
              }}
              className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-1.5 ${
                isLightTheme ? 'bg-white text-stone-700 border-[#E5E0D8] hover:bg-stone-50' : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
              }`}
              title={soundEnabled ? 'Sound stummschalten' : 'Sound einschalten'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span>Ton An</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3" />
                  <span>Ton Aus</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Centered Board & Arena Layout without Sidebar */}
        <main className="max-w-4xl mx-auto w-full flex flex-col items-center space-y-4">
          {/* Main Visual Arena Column (Board) */}
          <div className="w-full flex flex-col items-center space-y-4">
            {/* Active Turn Information Banner */}
            <div className={`w-full ${currentTheme.sidebarBg} rounded-2xl border py-2.5 px-4 flex items-center justify-between shadow-md`}>
              <div className="flex items-center gap-3">
                {/* Visual Turn light indicator */}
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      gameState.phase === 'GAME_OVER'
                        ? 'bg-rose-500'
                        : gameState.currentPlayer === 'PLAYER'
                        ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]'
                        : 'bg-amber-500 shadow-[0_0_12px_#f59e0b] animate-pulse'
                    }`}
                  />
                  {gameState.currentPlayer === 'COMPUTER' && gameState.phase !== 'GAME_OVER' && (
                    <span className="absolute -inset-1.5 rounded-full border border-amber-500/30 animate-ping" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-inherit opacity-70 block">
                    {gameState.phase === 'GAME_OVER'
                      ? 'Spiel Beendet'
                      : gameState.currentPlayer === 'PLAYER'
                      ? 'Du am Zug'
                      : 'Computer rechnet'}
                  </span>
                  <span className="text-sm font-bold text-inherit block leading-tight">
                    {getSubTitleText()}
                  </span>
                </div>
              </div>

              {/* Badges for parameters */}
              <div className="flex gap-2 items-center">
                {/* 30-second turn timer */}
                {gameState.phase !== 'GAME_OVER' && (
                  <div 
                    className={`flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-xl font-bold font-mono text-xs sm:text-sm border shadow-sm transition-all duration-300 ${
                      turnSecondsLeft <= 5 
                        ? 'bg-rose-500/25 border-rose-500/50 text-rose-500 animate-pulse scale-105' 
                        : (isLightTheme ? 'bg-amber-100 border-amber-300/60 text-stone-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')
                    }`}
                    title="Bedenkzeit für diesen Zug"
                  >
                    <Clock className={`w-3.5 h-3.5 ${turnSecondsLeft <= 5 ? 'animate-spin' : ''}`} style={{ animationDuration: '1.5s' }} />
                    <span className="hidden sm:inline opacity-75 mr-0.5 text-[10px] uppercase font-bold">Zeit:</span>
                    <span>{turnSecondsLeft}s</span>
                  </div>
                )}

                <span className="text-[10px] px-2 py-0.5 font-bold rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-tight">
                  {gameState.phase === 'PLACING' && 'Setzen (Phase 1)'}
                  {gameState.phase === 'MOVING' && 'Ziehen (Phase 2)'}
                  {gameState.phase === 'FLYING' && 'Springen (Phase 3)'}
                  {gameState.phase === 'MILL_REMOVE' && 'Mühle schlagen'}
                  {gameState.phase === 'GAME_OVER' && 'Endstand'}
                </span>
                <span className="text-[10px] px-2 py-0.5 font-bold rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                  Gesamt: {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60) < 10 ? '0' : ''}{secondsElapsed % 60}
                </span>
              </div>
            </div>

            {gameState.phase === 'GAME_OVER' && (
              <div className="w-full bg-gradient-to-r from-amber-500/25 via-amber-600/10 to-transparent border border-amber-600/40 p-5 rounded-2xl space-y-3 shadow-2xl animate-fadeIn">
                <h4 className="font-sans font-bold text-lg text-amber-400 flex items-center gap-1.5 leading-snug">
                  <Award className="w-6 h-6 text-amber-500" />
                  {gameState.currentPlayer === 'PLAYER'
                    ? 'Glückwunsch! Du hast gewonnen! 🎉'
                    : 'Bedenkzeit abgelaufen oder verloren gegen die KI! 🤖'}
                </h4>
                <p className="text-xs opacity-90 leading-normal">
                  {gameState.currentPlayer === 'PLAYER'
                    ? 'Gewonnen! Du hast den Computer mit taktischer Präzision bezwungen!'
                    : 'Niederlage! Der Computer beansprucht den Sieg. Probiere es mit einer Revanche!'}
                </p>
                <div className="flex gap-3">
                  <button
                    id="rematch-btn"
                    onClick={handleStartNewGame}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold leading-none shadow-md transition ${currentTheme.buttonPrimary}`}
                  >
                    Revanche starten
                  </button>
                </div>
              </div>
            )}

            {/* Core Vector game board flanked by left/right physical piece racks */}
            <div className="w-full flex flex-row items-center justify-center gap-2 md:gap-4 relative select-none">
              
              {/* LEFT FLANK: Player's piece rack (Du links) */}
              <div 
                className={`w-10 sm:w-12 py-3 px-0.5 sm:px-1.5 rounded-2xl flex flex-col items-center justify-between gap-1 border self-stretch transition-all duration-500 shadow-sm ${
                  currentTheme.sidebarBg
                }`}
                title="Deine Steine (Du)"
              >
                <div className="text-[8px] font-bold uppercase tracking-wider text-center opacity-70 mb-1 leading-tight hidden sm:block">
                  Du
                </div>
                
                {/* 9 Slots */}
                <div className="flex-1 flex flex-col justify-around w-full items-center gap-1 min-h-[170px] sm:min-h-[220px]">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const playerOnBoard = countPiecesOnBoard(gameState.board, 'PLAYER');
                    const piecesToPlace = gameState.playerPiecesToPlace;
                    
                    let state: 'UNPLACED' | 'PLACED' | 'CAPTURED' = 'UNPLACED';
                    if (i < piecesToPlace) {
                      state = 'UNPLACED';
                    } else if (i < piecesToPlace + playerOnBoard) {
                      state = 'PLACED';
                    } else {
                      state = 'CAPTURED';
                    }

                    return (
                      <div 
                        key={`left-rack-slot-${i}`}
                        className="relative w-4 h-4 sm:w-[18px] sm:h-[18px] flex items-center justify-center rounded-full"
                      >
                        {state === 'UNPLACED' && (
                          <div 
                            className={`w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-full ${currentTheme.playerPiece} transition-all duration-300 animate-fadeIn`}
                          />
                        )}
                        {state === 'PLACED' && (
                          <div 
                            className="w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-full border border-dashed border-emerald-500/40 bg-emerald-500/5 flex items-center justify-center"
                            title="Auf dem Brett"
                          >
                            <span className="text-[5px] font-mono text-emerald-500/50 font-bold leading-none">✓</span>
                          </div>
                        )}
                        {state === 'CAPTURED' && (
                          <div 
                            className="w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-full border border-dotted border-rose-500/20 bg-rose-500/5 flex items-center justify-center"
                            title="Geschlagen"
                          >
                            <span className="text-[5px] text-rose-500/40 font-bold leading-none">✕</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-[7px] font-mono opacity-60 mt-1 leading-none text-center">
                  {countPiecesOnBoard(gameState.board, 'PLAYER')}B/{gameState.playerPiecesToPlace}R
                </div>
              </div>

              {/* CENTER: The main game board */}
              <div className="flex-1 max-w-[425px] sm:max-w-[460px] md:max-w-[480px] w-full transition-all duration-300 relative group">
                <GameBoardView
                  board={gameState.board}
                  currentPlayer={gameState.currentPlayer}
                  currentTheme={currentTheme}
                  selectedPieceId={gameState.selectedPieceId}
                  validTargets={getValidTargets()}
                  millRemovalTriggered={gameState.phase === 'MILL_REMOVE'}
                  onPositionClick={handlePositionClick}
                  validRemoveTargets={currentRemoveTargets}
                />

                {isPaused && (
                  <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-4 space-y-3 z-30 animate-fadeIn">
                    <div className="p-2 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400">
                      <Pause className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-sans font-black text-sm text-amber-400 uppercase tracking-widest leading-none">Pausiert</h3>
                      <p className="text-[10px] text-stone-300 max-w-[170px] font-medium leading-tight">Spielzüge und Zeit eingefroren.</p>
                    </div>
                    <button
                      onClick={() => setIsPaused(false)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-[10px] uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      Fortsetzen
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT FLANK: Computer's piece rack (Computer rechts) */}
              <div 
                className={`w-10 sm:w-12 py-3 px-0.5 sm:px-1.5 rounded-2xl flex flex-col items-center justify-between gap-1 border self-stretch transition-all duration-500 shadow-sm ${
                  currentTheme.sidebarBg
                }`}
                title="Computer Steine (Rechts)"
              >
                <div className="text-[8px] font-bold uppercase tracking-wider text-center opacity-70 mb-1 leading-tight hidden sm:block">
                  Comp
                </div>
                
                {/* 9 Slots */}
                <div className="flex-1 flex flex-col justify-around w-full items-center gap-1 min-h-[170px] sm:min-h-[220px]">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const computerOnBoard = countPiecesOnBoard(gameState.board, 'COMPUTER');
                    const piecesToPlace = gameState.computerPiecesToPlace;
                    
                    let state: 'UNPLACED' | 'PLACED' | 'CAPTURED' = 'UNPLACED';
                    if (i < piecesToPlace) {
                      state = 'UNPLACED';
                    } else if (i < piecesToPlace + computerOnBoard) {
                      state = 'PLACED';
                    } else {
                      state = 'CAPTURED';
                    }

                    return (
                      <div 
                        key={`right-rack-slot-${i}`}
                        className="relative w-4 h-4 sm:w-[18px] sm:h-[18px] flex items-center justify-center rounded-full"
                      >
                        {state === 'UNPLACED' && (
                          <div 
                            className={`w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-full ${currentTheme.computerPiece} transition-all duration-300 animate-fadeIn`}
                          />
                        )}
                        {state === 'PLACED' && (
                          <div 
                            className="w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-full border border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-center"
                            title="Auf dem Brett"
                          >
                            <span className="text-[5px] font-mono text-amber-500/50 font-bold leading-none">✓</span>
                          </div>
                        )}
                        {state === 'CAPTURED' && (
                          <div 
                            className="w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-full border border-dotted border-rose-500/20 bg-rose-500/5 flex items-center justify-center"
                            title="Geschlagen"
                          >
                            <span className="text-[5px] text-rose-500/40 font-bold leading-none">✕</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-[7px] font-mono opacity-60 mt-1 leading-none text-center">
                  {countPiecesOnBoard(gameState.board, 'COMPUTER')}B/{gameState.computerPiecesToPlace}R
                </div>
              </div>

            </div>

            {/* Mittig unten: Spiel und Neues Spiel Buttons */}
            <div className="flex justify-center items-center gap-4 mt-4 sm:mt-5 pb-2">
              {/* Spiel Button / Pause-Taste */}
              <button
                id="pause-toggle-btn"
                onClick={() => {
                  if (gameState.phase !== 'GAME_OVER') {
                    const nextPause = !isPaused;
                    setIsPaused(nextPause);
                    addLog(nextPause ? 'Spiel pausiert.' : 'Spiel fortgesetzt.');
                    playSound('select');
                  }
                }}
                disabled={gameState.phase === 'GAME_OVER'}
                className={`px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 rounded-xl shadow-sm transition-all duration-200 border ${
                  gameState.phase === 'GAME_OVER'
                    ? 'opacity-50 cursor-not-allowed bg-stone-500/10 border-stone-500/20 text-stone-500'
                    : isPaused
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-500 hover:scale-105 active:scale-95'
                    : 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:scale-105 active:scale-95'
                }`}
                title={isPaused ? "Das Spiel fortsetzen" : "Das Spiel pausieren"}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 text-amber-500" />
                    <span>Fortsetzen</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-emerald-500" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              {/* Neues Spiel Button */}
              <button
                id="new-game-btn-bottom"
                onClick={handleStartNewGame}
                className="px-6 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all bg-amber-500 hover:bg-amber-600 text-stone-950 hover:scale-105 active:scale-95 duration-200 shadow-md flex items-center gap-2"
                title="Ein neues Mühlespiel starten"
              >
                <RotateCcw className="w-4 h-4 text-stone-950" />
                <span>Neues Spiel</span>
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* Footer footer-credit */}
      <footer className="w-full max-w-5xl mx-auto border-t border-current/10 pt-3 mt-4 text-center text-[10px] opacity-70 font-mono tracking-tight text-inherit">
        © 2026 Mühlespiel Brettspiel-Manufaktur · Entwickelt für Google AI Studio
      </footer>

      {/* Help Modal explaining rules */}
      <RulesModal isOpen={showRules} onClose={handleToggleRules} accentColor={currentTheme.boardLines} />
    </div>
  );
}
