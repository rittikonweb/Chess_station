import React from 'react';
import { GameStatus, PieceColor } from './useChessEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  gameStatus: GameStatus;
  currentPlayer: PieceColor;
}

/**
 * Game Controls Component
 * Shows game status, current player, and game information
 */
export const GameControls: React.FC<GameControlsProps> = ({
  gameStatus,
  currentPlayer
}) => {
  const getStatusInfo = () => {
    switch (gameStatus) {
      case 'checkmate':
        const winner = currentPlayer === 'white' ? 'Black' : 'White';
        return {
          icon: Trophy,
          text: `${winner} Wins!`,
          description: 'Checkmate',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/20'
        };
      
      case 'stalemate':
        return {
          icon: Shield,
          text: 'Stalemate',
          description: 'Draw game',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/20'
        };
      
      case 'check':
        return {
          icon: Shield,
          text: 'Check!',
          description: `${currentPlayer === 'white' ? 'White' : 'Black'} king in danger`,
          color: 'text-chess-check',
          bgColor: 'bg-chess-check/20'
        };
      
      case 'draw':
        return {
          icon: Shield,
          text: 'Draw',
          description: 'Game ended in a draw',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/20'
        };
      
      default:
        return {
          icon: Clock,
          text: 'Game in Progress',
          description: `${currentPlayer === 'white' ? 'White' : 'Black'}'s turn`,
          color: 'text-primary',
          bgColor: 'bg-primary/20'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={cn('transition-all duration-300', statusInfo.bgColor)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('w-6 h-6', statusInfo.color)} />
          
          <div className="flex-1">
            <h3 className={cn('font-bold text-lg', statusInfo.color)}>
              {statusInfo.text}
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Game status indicators */}
        <div className="mt-4 space-y-2">
          {gameStatus === 'playing' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold">Active Game</span>
            </div>
          )}
          
          {(gameStatus === 'checkmate' || gameStatus === 'stalemate') && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Game Result:</span>
              <span className="font-semibold">
                {gameStatus === 'checkmate' ? 'Decisive' : 'Draw'}
              </span>
            </div>
          )}
        </div>

        {/* Game rules reminder */}
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <h4 className="text-sm font-semibold mb-2">Quick Rules:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click or drag pieces to move</li>
            <li>• Valid moves are highlighted</li>
            <li>• Capture opponent pieces</li>
            <li>• Protect your king from check</li>
            <li>• Checkmate wins the game</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
