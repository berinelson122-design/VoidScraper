import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';
import MainScene from '../game/scenes/MainScene';
import { RotateCcw, X } from 'lucide-react';

interface GameRunnerProps {
  onExit: () => void;
}

const GameRunner: React.FC<GameRunnerProps> = ({ onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Define event handlers that can be called from within the Phaser scene
  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setIsGameOver(true);
  };

  const handleScoreUpdate = (currentScore: number) => {
    setScore(currentScore);
  };

  const startNewGame = () => {
    setIsGameOver(false);
    setScore(0);
    if (gameInstanceRef.current) {
      const scene = gameInstanceRef.current.scene.getScene('MainScene') as MainScene;
      scene.restartGame();
    }
  };

  useEffect(() => {
    if (!gameRef.current) return;

    // Initialize Phaser Game
    const config = createGameConfig(gameRef.current, {
      onGameOver: handleGameOver,
      onScoreUpdate: handleScoreUpdate
    });

    gameInstanceRef.current = new Phaser.Game(config);

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-video bg-[#000] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-[#333]">
      
      {/* Phaser Container */}
      <div ref={gameRef} className="w-full h-full" />

      {/* HUD Layer */}
      <div className="absolute top-4 left-6 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs text-[#39ff14] font-bold tracking-widest uppercase mb-1">Score</span>
          <span className="text-4xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] font-mono">
            {score.toString().padStart(4, '0')}
          </span>
        </div>
      </div>

      <button 
        onClick={onExit}
        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
        aria-label="Exit Game"
      >
        <X size={24} />
      </button>

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
          <h2 className="text-6xl font-black text-[#ff003c] mb-2 italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,0,60,0.6)]">
            SYNC LOST
          </h2>
          <div className="text-2xl text-white mb-8 font-mono">
            SCORE: <span className="text-[#39ff14]">{score}</span>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={startNewGame}
              className="flex items-center gap-2 px-6 py-3 bg-[#39ff14] text-black font-bold rounded hover:bg-[#32d912] hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all transform hover:scale-105"
            >
              <RotateCcw size={20} />
              RETRY
            </button>
            <button
              onClick={onExit}
              className="px-6 py-3 border border-gray-600 text-gray-300 font-bold rounded hover:bg-white/10 transition-all"
            >
              QUIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRunner;