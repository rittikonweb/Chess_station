import React from 'react';
import { ChessMove } from './useChessEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoveHistoryProps {
  moves: ChessMove[];
  currentMoveIndex: number;
}

/**
 * Move History Component
 * Displays the game's move history in algebraic notation
 */
export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  currentMoveIndex
}) => {
  // Group moves into pairs (white move, black move)
  const movePairs: { white?: ChessMove; black?: ChessMove; moveNumber: number }[] = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1],
      moveNumber: Math.floor(i / 2) + 1
    });
  }

  return (
    <Card className="bg-card/50 backdrop-blur h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          Move History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80 px-6">
          {moves.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-center">
                Game not started yet.<br />
                Make your first move!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {movePairs.map((pair, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 py-2 px-3 rounded-md transition-colors',
                    'hover:bg-muted/50'
                  )}
                >
                  {/* Move number */}
                  <span className="text-sm font-semibold text-muted-foreground min-w-[2rem]">
                    {pair.moveNumber}.
                  </span>

                  {/* White move */}
                  <div className="flex-1 min-w-0">
                    {pair.white && (
                      <MoveItem
                        move={pair.white}
                        isActive={moves.indexOf(pair.white) === currentMoveIndex}
                        color="white"
                      />
                    )}
                  </div>

                  {/* Black move */}
                  <div className="flex-1 min-w-0">
                    {pair.black && (
                      <MoveItem
                        move={pair.black}
                        isActive={moves.indexOf(pair.black) === currentMoveIndex}
                        color="black"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface MoveItemProps {
  move: ChessMove;
  isActive: boolean;
  color: 'white' | 'black';
}

/**
 * Individual move item component
 */
const MoveItem: React.FC<MoveItemProps> = ({ move, isActive, color }) => {
  return (
    <div
      className={cn(
        'px-2 py-1 rounded text-sm font-mono transition-all duration-200',
        isActive && 'bg-primary text-primary-foreground shadow-sm',
        !isActive && 'hover:bg-muted/30',
        color === 'white' ? 'text-chess-light' : 'text-foreground'
      )}
    >
      <span className="flex items-center gap-1">
        {/* Move notation */}
        <span className="font-semibold">{move.notation}</span>
        
        {/* Special move indicators */}
        {move.isCapture && !move.notation.includes('x') && (
          <span className="text-chess-capture text-xs">×</span>
        )}
        
        {move.castling && (
          <span className="text-primary text-xs">
            {move.castling === 'kingside' ? '♔' : '♕'}
          </span>
        )}
        
        {move.enPassant && (
          <span className="text-yellow-400 text-xs">e.p.</span>
        )}
        
        {move.promotion && (
          <span className="text-primary text-xs">={move.promotion.charAt(0).toUpperCase()}</span>
        )}
        
        {move.isCheck && !move.isCheckmate && (
          <span className="text-chess-check text-xs">+</span>
        )}
        
        {move.isCheckmate && (
          <span className="text-chess-check text-xs">#</span>
        )}
      </span>
    </div>
  );
};
