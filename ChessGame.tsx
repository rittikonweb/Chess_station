import React, { useState, useEffect, useCallback } from 'react';
import { ChessBoard } from './ChessBoard';
import { MoveHistory } from './MoveHistory';
import { GameControls } from './GameControls';
import { PlayerInfo } from './PlayerInfo';
import { useChessEngine } from './useChessEngine';
import { useSoundEffects } from './useSoundEffects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

/**
 * Main Chess Game Component
 * Manages the overall game state and coordinates between different components
 */
export const ChessGame: React.FC = () => {
  const {
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
  } = useChessEngine();

  const { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } = useSoundEffects();

  // Play appropriate sounds based on game events
  useEffect(() => {
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      
      if (lastMove.isCapture) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
      
      if (isInCheck) {
        playCheckSound();
      }
      
      if (gameStatus === 'checkmate' || gameStatus === 'stalemate') {
        playGameOverSound();
      }
    }
  }, [moveHistory, isInCheck, gameStatus, playMoveSound, playCaptureSound, playCheckSound, playGameOverSound]);

  const handleResetGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
            Chess Master
          </h1>
          <p className="text-muted-foreground text-lg">
            A fully functional chess game with all standard rules
          </p>
        </div>

        {/* Game Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Sidebar - Player Info & Controls */}
          <div className="xl:order-1 space-y-6">
            <PlayerInfo 
              player="white" 
              isActive={currentPlayer === 'white'}
              capturedPieces={capturedPieces.black}
              isInCheck={isInCheck && currentPlayer === 'white'}
            />
            
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={handleResetGame}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                  
                  <GameControls 
                    gameStatus={gameStatus}
                    currentPlayer={currentPlayer}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Chess Board */}
          <div className="xl:order-2 flex justify-center">
            <ChessBoard
              board={board}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
              onPieceMove={handlePieceMove}
              isValidMove={isValidMove}
              getSquareColor={getSquareColor}
              currentPlayer={currentPlayer}
            />
          </div>

          {/* Right Sidebar - Move History & Player Info */}
          <div className="xl:order-3 space-y-6">
            <PlayerInfo 
              player="black" 
              isActive={currentPlayer === 'black'}
              capturedPieces={capturedPieces.white}
              isInCheck={isInCheck && currentPlayer === 'black'}
            />
            
            <MoveHistory 
              moves={moveHistory}
              currentMoveIndex={moveHistory.length - 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
