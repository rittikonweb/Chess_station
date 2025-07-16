import React from 'react';
import { ChessPiece, PieceColor } from './useChessEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerInfoProps {
  player: PieceColor;
  isActive: boolean;
  capturedPieces: ChessPiece[];
  isInCheck: boolean;
}

// Unicode chess piece symbols for captured pieces
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

// Piece values for material count
const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
};

/**
 * Player Information Component
 * Shows player status, captured pieces, and material advantage
 */
export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  isActive,
  capturedPieces,
  isInCheck
}) => {
  // Calculate material advantage
  const materialValue = capturedPieces.reduce((total, piece) => {
    return total + PIECE_VALUES[piece.type];
  }, 0);

  // Group captured pieces by type for better display
  const groupedPieces = capturedPieces.reduce((groups, piece) => {
    if (!groups[piece.type]) {
      groups[piece.type] = [];
    }
    groups[piece.type].push(piece);
    return groups;
  }, {} as Record<string, ChessPiece[]>);

  const playerName = player === 'white' ? 'White' : 'Black';
  const playerColor = player === 'white' ? 'text-chess-light' : 'text-foreground';

  return (
    <Card className={cn(
      'transition-all duration-300 bg-card/50 backdrop-blur',
      isActive && 'ring-2 ring-primary ring-opacity-60 shadow-lg',
      isInCheck && 'ring-2 ring-chess-check ring-opacity-80 shadow-red-500/20'
    )}>
      <CardContent className="p-4">
        {/* Player header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className={cn('w-5 h-5', playerColor)} />
            <h3 className={cn('font-bold text-lg', playerColor)}>
              {playerName}
            </h3>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {isActive && (
              <div className={cn(
                'w-3 h-3 rounded-full animate-pulse',
                player === 'white' ? 'bg-chess-light' : 'bg-foreground'
              )} />
            )}
            
            {isInCheck && (
              <div className="flex items-center gap-1 text-chess-check">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-semibold">CHECK</span>
              </div>
            )}
          </div>
        </div>

        {/* Captured pieces */}
        {capturedPieces.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Captured Pieces
            </h4>
            
            <div className="flex flex-wrap gap-1">
              {Object.entries(groupedPieces).map(([pieceType, pieces]) => (
                <div key={pieceType} className="flex items-center gap-1">
                  {pieces.map((piece, index) => (
                    <span
                      key={`${pieceType}-${index}`}
                      className={cn(
                        'text-lg',
                        piece.color === 'white' ? 'text-chess-light' : 'text-foreground',
                        'drop-shadow-sm'
                      )}
                      title={`${piece.color} ${piece.type}`}
                    >
                      {PIECE_SYMBOLS[piece.color][piece.type]}
                    </span>
                  ))}
                  {pieces.length > 1 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ×{pieces.length}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Material advantage */}
            {materialValue > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Material:</span>
                <span className={cn(
                  'text-sm font-bold',
                  materialValue > 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  +{materialValue}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {capturedPieces.length === 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              No captures yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
