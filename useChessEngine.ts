import { useState, useCallback, useMemo } from 'react';

// Chess piece types and colors
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface ChessSquare {
  row: number;
  col: number;
}

export interface ChessMove {
  from: ChessSquare;
  to: ChessSquare;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  notation: string;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  promotion?: PieceType;
}

// Initial board setup
const createInitialBoard = (): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pieces for both sides
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  // White pieces (bottom)
  pieceOrder.forEach((type, col) => {
    board[7][col] = { type, color: 'white' };
  });
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Black pieces (top)
  pieceOrder.forEach((type, col) => {
    board[0][col] = { type, color: 'black' };
  });
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
  }
  
  return board;
};

/**
 * Custom hook that manages all chess game logic
 * Implements all standard chess rules including castling, en passant, and promotion
 */
export const useChessEngine = () => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [moveHistory, setMoveHistory] = useState<ChessMove[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [enPassantTarget, setEnPassantTarget] = useState<ChessSquare | null>(null);

  // Get valid moves for the selected piece
  const validMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return getValidMoves(board, selectedSquare, currentPlayer, enPassantTarget, moveHistory);
  }, [board, selectedSquare, currentPlayer, enPassantTarget, moveHistory]);

  // Check if the current player is in check
  const isInCheck = useMemo(() => {
    return isKingInCheck(board, currentPlayer);
  }, [board, currentPlayer]);

  // Get captured pieces for display
  const capturedPieces = useMemo(() => {
    const captured = { white: [] as ChessPiece[], black: [] as ChessPiece[] };
    moveHistory.forEach(move => {
      if (move.capturedPiece) {
        captured[move.capturedPiece.color].push(move.capturedPiece);
      }
    });
    return captured;
  }, [moveHistory]);

  /**
   * Handle square click for piece selection and movement
   */
  const handleSquareClick = useCallback((square: ChessSquare) => {
    const piece = board[square.row][square.col];
    
    if (selectedSquare) {
      // Try to move the selected piece
      if (isValidMoveAttempt(board, selectedSquare, square, currentPlayer, enPassantTarget, moveHistory)) {
        makeMove(selectedSquare, square);
      } else if (piece && piece.color === currentPlayer) {
        // Select a different piece of the same color
        setSelectedSquare(square);
      } else {
        // Deselect
        setSelectedSquare(null);
      }
    } else if (piece && piece.color === currentPlayer) {
      // Select a piece
      setSelectedSquare(square);
    }
  }, [board, selectedSquare, currentPlayer, enPassantTarget, moveHistory]);

  /**
   * Handle drag and drop piece movement
   */
  const handlePieceMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    if (isValidMoveAttempt(board, from, to, currentPlayer, enPassantTarget, moveHistory)) {
      makeMove(from, to);
      setSelectedSquare(null);
    }
  }, [board, currentPlayer, enPassantTarget, moveHistory]);

  /**
   * Make a move on the board
   */
  const makeMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col]!;
    const capturedPiece = newBoard[to.row][to.col];
    
    // Handle special moves
    let castling: 'kingside' | 'queenside' | undefined;
    let enPassant = false;
    let promotion: PieceType | undefined;

    // Check for castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      castling = to.col > from.col ? 'kingside' : 'queenside';
      // Move the rook
      const rookFromCol = castling === 'kingside' ? 7 : 0;
      const rookToCol = castling === 'kingside' ? 5 : 3;
      const rook = newBoard[from.row][rookFromCol]!;
      newBoard[from.row][rookToCol] = { ...rook, hasMoved: true };
      newBoard[from.row][rookFromCol] = null;
    }

    // Check for en passant
    if (piece.type === 'pawn' && enPassantTarget && 
        to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
      enPassant = true;
      // Remove the captured pawn
      newBoard[from.row][to.col] = null;
    }

    // Check for pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      promotion = 'queen'; // Auto-promote to queen for simplicity
    }

    // Make the move
    newBoard[to.row][to.col] = promotion ? 
      { ...piece, type: promotion, hasMoved: true } : 
      { ...piece, hasMoved: true };
    newBoard[from.row][from.col] = null;

    // Update en passant target
    let newEnPassantTarget: ChessSquare | null = null;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      newEnPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
    }

    // Check if the move puts the opponent in check
    const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
    const isCheck = isKingInCheck(newBoard, opponentColor);
    const isCheckmate = isCheck && !hasValidMoves(newBoard, opponentColor, newEnPassantTarget, moveHistory);
    const isStalemate = !isCheck && !hasValidMoves(newBoard, opponentColor, newEnPassantTarget, moveHistory);

    // Create move record
    const move: ChessMove = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      isCapture: !!capturedPiece || enPassant,
      isCheck,
      isCheckmate,
      notation: generateAlgebraicNotation(piece, from, to, !!capturedPiece || enPassant, isCheck, isCheckmate, castling, promotion),
      castling,
      enPassant,
      promotion
    };

    // Update state
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, move]);
    setCurrentPlayer(opponentColor);
    setSelectedSquare(null);
    setEnPassantTarget(newEnPassantTarget);

    // Update game status
    if (isCheckmate) {
      setGameStatus('checkmate');
    } else if (isStalemate) {
      setGameStatus('stalemate');
    } else if (isCheck) {
      setGameStatus('check');
    } else {
      setGameStatus('playing');
    }
  }, [board, currentPlayer, enPassantTarget, moveHistory]);

  /**
   * Reset the game to initial state
   */
  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer('white');
    setSelectedSquare(null);
    setMoveHistory([]);
    setGameStatus('playing');
    setEnPassantTarget(null);
  }, []);

  /**
   * Check if a move is valid
   */
  const isValidMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    return isValidMoveAttempt(board, from, to, currentPlayer, enPassantTarget, moveHistory);
  }, [board, currentPlayer, enPassantTarget, moveHistory]);

  /**
   * Get the color of a square for highlighting
   */
  const getSquareColor = useCallback((square: ChessSquare) => {
    if (selectedSquare && square.row === selectedSquare.row && square.col === selectedSquare.col) {
      return 'selected';
    }
    if (validMoves.some(move => move.row === square.row && move.col === square.col)) {
      return 'valid';
    }
    if (isInCheck) {
      const piece = board[square.row][square.col];
      if (piece && piece.type === 'king' && piece.color === currentPlayer) {
        return 'check';
      }
    }
    return 'normal';
  }, [selectedSquare, validMoves, isInCheck, board, currentPlayer]);

  return {
    board,
    currentPlayer,
    gameStatus,
    selectedSquare,
    validMoves,
    moveHistory,
    isInCheck,
    capturedPieces,
    handleSquareClick,
    handlePieceMove,
    resetGame,
    isValidMove,
    getSquareColor
  };
};

// Helper functions for chess logic

/**
 * Get all valid moves for a piece at a given position
 */
function getValidMoves(
  board: (ChessPiece | null)[][],
  from: ChessSquare,
  currentPlayer: PieceColor,
  enPassantTarget: ChessSquare | null,
  moveHistory: ChessMove[]
): ChessSquare[] {
  const piece = board[from.row][from.col];
  if (!piece || piece.color !== currentPlayer) return [];

  const moves: ChessSquare[] = [];

  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(board, from, enPassantTarget));
      break;
    case 'rook':
      moves.push(...getRookMoves(board, from));
      break;
    case 'knight':
      moves.push(...getKnightMoves(board, from));
      break;
    case 'bishop':
      moves.push(...getBishopMoves(board, from));
      break;
    case 'queen':
      moves.push(...getQueenMoves(board, from));
      break;
    case 'king':
      moves.push(...getKingMoves(board, from, moveHistory));
      break;
  }

  // Filter out moves that would put own king in check
  return moves.filter(to => {
    const testBoard = simulateMove(board, from, to);
    return !isKingInCheck(testBoard, currentPlayer);
  });
}

/**
 * Get valid moves for a pawn
 */
function getPawnMoves(
  board: (ChessPiece | null)[][],
  from: ChessSquare,
  enPassantTarget: ChessSquare | null
): ChessSquare[] {
  const piece = board[from.row][from.col]!;
  const moves: ChessSquare[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // Forward moves
  const oneForward = { row: from.row + direction, col: from.col };
  if (isInBounds(oneForward) && !board[oneForward.row][oneForward.col]) {
    moves.push(oneForward);

    // Two squares forward from starting position
    if (from.row === startRow) {
      const twoForward = { row: from.row + 2 * direction, col: from.col };
      if (isInBounds(twoForward) && !board[twoForward.row][twoForward.col]) {
        moves.push(twoForward);
      }
    }
  }

  // Captures
  [-1, 1].forEach(colOffset => {
    const captureSquare = { row: from.row + direction, col: from.col + colOffset };
    if (isInBounds(captureSquare)) {
      const target = board[captureSquare.row][captureSquare.col];
      if (target && target.color !== piece.color) {
        moves.push(captureSquare);
      }
    }
  });

  // En passant
  if (enPassantTarget) {
    const enPassantCapture = { row: enPassantTarget.row, col: enPassantTarget.col };
    if (Math.abs(from.col - enPassantTarget.col) === 1 && from.row === enPassantTarget.row + direction) {
      moves.push(enPassantCapture);
    }
  }

  return moves;
}

/**
 * Get valid moves for a rook
 */
function getRookMoves(board: (ChessPiece | null)[][], from: ChessSquare): ChessSquare[] {
  const moves: ChessSquare[] = [];
  const piece = board[from.row][from.col]!;

  // Horizontal and vertical directions
  const directions = [
    { row: 0, col: 1 },   // Right
    { row: 0, col: -1 },  // Left
    { row: 1, col: 0 },   // Down
    { row: -1, col: 0 }   // Up
  ];

  directions.forEach(dir => {
    let current = { row: from.row + dir.row, col: from.col + dir.col };
    
    while (isInBounds(current)) {
      const target = board[current.row][current.col];
      
      if (!target) {
        moves.push({ ...current });
      } else {
        if (target.color !== piece.color) {
          moves.push({ ...current });
        }
        break;
      }
      
      current = { row: current.row + dir.row, col: current.col + dir.col };
    }
  });

  return moves;
}

/**
 * Get valid moves for a knight
 */
function getKnightMoves(board: (ChessPiece | null)[][], from: ChessSquare): ChessSquare[] {
  const moves: ChessSquare[] = [];
  const piece = board[from.row][from.col]!;

  const knightMoves = [
    { row: -2, col: -1 }, { row: -2, col: 1 },
    { row: -1, col: -2 }, { row: -1, col: 2 },
    { row: 1, col: -2 },  { row: 1, col: 2 },
    { row: 2, col: -1 },  { row: 2, col: 1 }
  ];

  knightMoves.forEach(move => {
    const to = { row: from.row + move.row, col: from.col + move.col };
    if (isInBounds(to)) {
      const target = board[to.row][to.col];
      if (!target || target.color !== piece.color) {
        moves.push(to);
      }
    }
  });

  return moves;
}

/**
 * Get valid moves for a bishop
 */
function getBishopMoves(board: (ChessPiece | null)[][], from: ChessSquare): ChessSquare[] {
  const moves: ChessSquare[] = [];
  const piece = board[from.row][from.col]!;

  // Diagonal directions
  const directions = [
    { row: 1, col: 1 },   // Down-right
    { row: 1, col: -1 },  // Down-left
    { row: -1, col: 1 },  // Up-right
    { row: -1, col: -1 }  // Up-left
  ];

  directions.forEach(dir => {
    let current = { row: from.row + dir.row, col: from.col + dir.col };
    
    while (isInBounds(current)) {
      const target = board[current.row][current.col];
      
      if (!target) {
        moves.push({ ...current });
      } else {
        if (target.color !== piece.color) {
          moves.push({ ...current });
        }
        break;
      }
      
      current = { row: current.row + dir.row, col: current.col + dir.col };
    }
  });

  return moves;
}

/**
 * Get valid moves for a queen (combination of rook and bishop)
 */
function getQueenMoves(board: (ChessPiece | null)[][], from: ChessSquare): ChessSquare[] {
  return [...getRookMoves(board, from), ...getBishopMoves(board, from)];
}

/**
 * Get valid moves for a king
 */
function getKingMoves(
  board: (ChessPiece | null)[][],
  from: ChessSquare,
  moveHistory: ChessMove[]
): ChessSquare[] {
  const moves: ChessSquare[] = [];
  const piece = board[from.row][from.col]!;

  // Normal king moves
  const kingMoves = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 },                        { row: 0, col: 1 },
    { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 }
  ];

  kingMoves.forEach(move => {
    const to = { row: from.row + move.row, col: from.col + move.col };
    if (isInBounds(to)) {
      const target = board[to.row][to.col];
      if (!target || target.color !== piece.color) {
        moves.push(to);
      }
    }
  });

  // Castling
  if (!piece.hasMoved && !isKingInCheck(board, piece.color)) {
    // Kingside castling
    const kingSideRook = board[from.row][7];
    if (kingSideRook && kingSideRook.type === 'rook' && !kingSideRook.hasMoved) {
      if (!board[from.row][5] && !board[from.row][6]) {
        // Check if squares king passes through are not under attack
        const testSquares = [{ row: from.row, col: 5 }, { row: from.row, col: 6 }];
        if (!testSquares.some(sq => isSquareUnderAttack(board, sq, piece.color === 'white' ? 'black' : 'white'))) {
          moves.push({ row: from.row, col: 6 });
        }
      }
    }

    // Queenside castling
    const queenSideRook = board[from.row][0];
    if (queenSideRook && queenSideRook.type === 'rook' && !queenSideRook.hasMoved) {
      if (!board[from.row][1] && !board[from.row][2] && !board[from.row][3]) {
        // Check if squares king passes through are not under attack
        const testSquares = [{ row: from.row, col: 2 }, { row: from.row, col: 3 }];
        if (!testSquares.some(sq => isSquareUnderAttack(board, sq, piece.color === 'white' ? 'black' : 'white'))) {
          moves.push({ row: from.row, col: 2 });
        }
      }
    }
  }

  return moves;
}

/**
 * Check if a square is within the board bounds
 */
function isInBounds(square: ChessSquare): boolean {
  return square.row >= 0 && square.row < 8 && square.col >= 0 && square.col < 8;
}

/**
 * Check if a king is in check
 */
function isKingInCheck(board: (ChessPiece | null)[][], kingColor: PieceColor): boolean {
  // Find the king
  let kingPosition: ChessSquare | null = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === kingColor) {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }

  if (!kingPosition) return false;

  // Check if any opponent piece can attack the king
  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPosition, opponentColor);
}

/**
 * Check if a square is under attack by a specific color
 */
function isSquareUnderAttack(
  board: (ChessPiece | null)[][],
  square: ChessSquare,
  attackingColor: PieceColor
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === attackingColor) {
        const from = { row, col };
        if (canPieceAttackSquare(board, from, square)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if a piece can attack a specific square
 */
function canPieceAttackSquare(
  board: (ChessPiece | null)[][],
  from: ChessSquare,
  to: ChessSquare
): boolean {
  const piece = board[from.row][from.col]!;

  switch (piece.type) {
    case 'pawn':
      const direction = piece.color === 'white' ? -1 : 1;
      return to.row === from.row + direction && Math.abs(to.col - from.col) === 1;
    
    case 'rook':
      return (from.row === to.row || from.col === to.col) && 
             isPathClear(board, from, to);
    
    case 'knight':
      const rowDiff = Math.abs(from.row - to.row);
      const colDiff = Math.abs(from.col - to.col);
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    
    case 'bishop':
      return Math.abs(from.row - to.row) === Math.abs(from.col - to.col) && 
             isPathClear(board, from, to);
    
    case 'queen':
      return ((from.row === to.row || from.col === to.col) || 
              (Math.abs(from.row - to.row) === Math.abs(from.col - to.col))) &&
             isPathClear(board, from, to);
    
    case 'king':
      return Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1;
    
    default:
      return false;
  }
}

/**
 * Check if the path between two squares is clear
 */
function isPathClear(board: (ChessPiece | null)[][], from: ChessSquare, to: ChessSquare): boolean {
  const rowDir = to.row === from.row ? 0 : (to.row - from.row) / Math.abs(to.row - from.row);
  const colDir = to.col === from.col ? 0 : (to.col - from.col) / Math.abs(to.col - from.col);

  let current = { row: from.row + rowDir, col: from.col + colDir };
  
  while (current.row !== to.row || current.col !== to.col) {
    if (board[current.row][current.col]) {
      return false;
    }
    current = { row: current.row + rowDir, col: current.col + colDir };
  }
  
  return true;
}

/**
 * Simulate a move and return the resulting board
 */
function simulateMove(
  board: (ChessPiece | null)[][],
  from: ChessSquare,
  to: ChessSquare
): (ChessPiece | null)[][] {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;
  
  return newBoard;
}

/**
 * Check if a move attempt is valid
 */
function isValidMoveAttempt(
  board: (ChessPiece | null)[][],
  from: ChessSquare,
  to: ChessSquare,
  currentPlayer: PieceColor,
  enPassantTarget: ChessSquare | null,
  moveHistory: ChessMove[]
): boolean {
  const piece = board[from.row][from.col];
  if (!piece || piece.color !== currentPlayer) return false;

  const validMoves = getValidMoves(board, from, currentPlayer, enPassantTarget, moveHistory);
  return validMoves.some(move => move.row === to.row && move.col === to.col);
}

/**
 * Check if a player has any valid moves
 */
function hasValidMoves(
  board: (ChessPiece | null)[][],
  playerColor: PieceColor,
  enPassantTarget: ChessSquare | null,
  moveHistory: ChessMove[]
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === playerColor) {
        const moves = getValidMoves(board, { row, col }, playerColor, enPassantTarget, moveHistory);
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Generate algebraic notation for a move
 */
function generateAlgebraicNotation(
  piece: ChessPiece,
  from: ChessSquare,
  to: ChessSquare,
  isCapture: boolean,
  isCheck: boolean,
  isCheckmate: boolean,
  castling?: 'kingside' | 'queenside',
  promotion?: PieceType
): string {
  if (castling) {
    return castling === 'kingside' ? 'O-O' : 'O-O-O';
  }

  const pieceSymbol = piece.type === 'pawn' ? '' : piece.type.charAt(0).toUpperCase();
  const fromSquare = `${String.fromCharCode(97 + from.col)}${8 - from.row}`;
  const toSquare = `${String.fromCharCode(97 + to.col)}${8 - to.row}`;
  const captureSymbol = isCapture ? 'x' : '';
  const checkSymbol = isCheckmate ? '#' : (isCheck ? '+' : '');
  const promotionSymbol = promotion ? `=${promotion.charAt(0).toUpperCase()}` : '';

  if (piece.type === 'pawn' && isCapture) {
    return `${fromSquare.charAt(0)}${captureSymbol}${toSquare}${promotionSymbol}${checkSymbol}`;
  }

  return `${pieceSymbol}${captureSymbol}${toSquare}${promotionSymbol}${checkSymbol}`;
}
