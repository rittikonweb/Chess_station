import React, { useCallback, useState } from 'react';
import { ChessPiece, ChessSquare, PieceColor } from './useChessEngine';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  board: (ChessPiece | null)[][];
  selectedSquare: ChessSquare | null;
  validMoves: ChessSquare[];
  onSquareClick: (square: ChessSquare) => void;
  onPieceMove: (from: ChessSquare, to: ChessSquare) => void;
  isValidMove: (from: ChessSquare, to: ChessSquare) => boolean;
  getSquareColor: (square: ChessSquare) => 'normal' | 'selected' | 'valid' | 'check';
  currentPlayer: PieceColor;
}

// Unicode chess piece symbols
const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
};

/**
 * Chess Board Component
 * Renders the 8x8 chess board with pieces and handles user interactions
 */
export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedSquare,
  validMoves,
  onSquareClick,
  onPieceMove,
  isValidMove,
  getSquareColor,
  currentPlayer
}) => {
  const [draggedPiece, setDraggedPiece] = useState<{
    piece: ChessPiece;
    from: ChessSquare;
  } | null>(null);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e: React.DragEvent, piece: ChessPiece, square: ChessSquare) => {
    if (piece.color !== currentPlayer) {
      e.preventDefault();
      return;
    }

    setDraggedPiece({ piece, from: square });
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(0deg) scale(1.2)';
    dragImage.style.opacity = '0.8';
    e.dataTransfer.setDragImage(dragImage, 30, 30);
    e.dataTransfer.effectAllowed = 'move';
  }, [currentPlayer]);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback((e: React.DragEvent, to: ChessSquare) => {
    e.preventDefault();
    
    if (draggedPiece) {
      if (isValidMove(draggedPiece.from, to)) {
        onPieceMove(draggedPiece.from, to);
      }
      setDraggedPiece(null);
    }
  }, [draggedPiece, isValidMove, onPieceMove]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
  }, []);

  /**
   * Render a single chess square
   */
  const renderSquare = (row: number, col: number) => {
    const square: ChessSquare = { row, col };
    const piece = board[row][col];
    const isLight = (row + col) % 2 === 0;
    const squareColor = getSquareColor(square);
    const isValidMoveTarget = validMoves.some(move => move.row === row && move.col === col);
    const isDraggedFrom = draggedPiece?.from.row === row && draggedPiece?.from.col === col;

    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          'relative aspect-square flex items-center justify-center text-4xl md:text-5xl lg:text-6xl font-bold cursor-pointer transition-all duration-200',
          // Base square colors
          isLight ? 'bg-chess-light' : 'bg-chess-dark',
          // Highlight colors
          squareColor === 'selected' && 'ring-4 ring-chess-highlight ring-opacity-80',
          squareColor === 'check' && 'bg-chess-check bg-opacity-80',
          // Valid move indicators
          isValidMoveTarget && 'after:absolute after:inset-0 after:bg-chess-highlight after:bg-opacity-30 after:rounded-full after:m-2',
          // Hover effects
          'hover:brightness-110',
          // Drag effects
          isDraggedFrom && 'opacity-50'
        )}
        onClick={() => onSquareClick(square)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, square)}
        data-square={`${String.fromCharCode(97 + col)}${8 - row}`}
      >
        {/* Square coordinates (for development) */}
        <div className="absolute top-0 left-0 text-xs text-muted-foreground opacity-20 p-1">
          {String.fromCharCode(97 + col)}{8 - row}
        </div>

        {/* Chess piece */}
        {piece && (
          <div
            className={cn(
              'select-none transition-transform duration-200 hover:scale-110 drop-shadow-lg',
              piece.color === 'white' ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-gray-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]',
              draggedPiece?.from.row === row && draggedPiece?.from.col === col ? 'cursor-grabbing' : 'cursor-grab'
            )}
            draggable={piece.color === currentPlayer}
            onDragStart={(e) => handleDragStart(e, piece, square)}
            onDragEnd={handleDragEnd}
          >
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </div>
        )}

        {/* Valid move indicator for empty squares */}
        {!piece && isValidMoveTarget && (
          <div className="w-4 h-4 bg-chess-highlight rounded-full opacity-60" />
        )}

        {/* Capture indicator for occupied squares */}
        {piece && isValidMoveTarget && piece.color !== currentPlayer && (
          <div className="absolute inset-0 border-4 border-chess-capture rounded-full opacity-80 animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Board */}
      <div 
        className={cn(
          'grid grid-cols-8 gap-0 border-4 border-chess-board-border rounded-lg overflow-hidden',
          'w-80 h-80 sm:w-96 sm:h-96 md:w-[32rem] md:h-[32rem] lg:w-[36rem] lg:h-[36rem]',
          'shadow-2xl bg-gradient-to-br from-chess-board-border to-secondary'
        )}
        style={{ 
          filter: 'drop-shadow(var(--shadow-board))',
          background: 'var(--gradient-board)'
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((_, colIndex) => renderSquare(rowIndex, colIndex))
        )}
      </div>

      {/* Board coordinates */}
      <div className="flex justify-between w-80 sm:w-96 md:w-[32rem] lg:w-[36rem] px-2">
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
            <span key={letter} className="w-8 text-center">{letter}</span>
          ))}
        </div>
      </div>

      {/* Current player indicator */}
      <div className={cn(
        'px-6 py-3 rounded-full border-2 transition-all duration-300',
        currentPlayer === 'white' 
          ? 'border-chess-light bg-chess-light/20 text-chess-light' 
          : 'border-foreground bg-foreground/20 text-foreground'
      )}>
        <span className="font-semibold">
          {currentPlayer === 'white' ? 'White' : 'Black'} to move
        </span>
      </div>
    </div>
  );
};
