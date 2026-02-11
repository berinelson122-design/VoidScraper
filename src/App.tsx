import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainScene from './game/scenes/MainScene';
import { Activity, ShieldAlert, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);
  const [isDead, setIsDead] = useState(false);

  useEffect(() => {
    if (!gameRef.current || gameInstance.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 800,
      height: 450,
      backgroundColor: '#000000',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [MainScene]
    };

    const game = new Phaser.Game(config);
    gameInstance.current = game;

    // EVENT_HANDSHAKE
    game.events.once('ready', () => {
      const scene = game.scene.getScene('MainScene') as MainScene;
      
      scene.events.on('SCORE_UPDATE', (s: number) => setScore(s));
      scene.events.on('PLAYER_DIED', () => setIsDead(true));
    });

    return () => {
      game.destroy(true);
      gameInstance.current = null;
    };
  }, []);

  const handleRestart = () => {
    const scene = gameInstance.current?.scene.getScene('MainScene') as MainScene;
    if (scene) {
      scene.restart();
      setIsDead(false);
      setScore(0);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-mono">
      
      <div className="scanlines" />

      {/* CANVAS CONTAINER */}
      <div ref={gameRef} className="w-full h-full border-4 border-[#111] shadow-[0_0_50px_rgba(224,86,253,0.1)]" />

      {/* HUD */}
      <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none z-40">
        <div className="flex items-center gap-2 text-[#E056FD]">
          <Activity size={16} className="animate-pulse" />
          <span className="text-xs uppercase tracking-[0.4em] font-black">Core_Signal</span>
        </div>
        <div className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_#E056FD]">
          {score.toString().padStart(6, '0')}
        </div>
      </div>

      {/* GAME OVER OVERLAY */}
      {isDead && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <ShieldAlert size={80} className="text-[#FF003C] mb-6 animate-bounce" />
          <h1 className="text-9xl font-black text-[#FF003C] tracking-tighter italic uppercase">Sync Lost</h1>
          <p className="text-[#E056FD] mt-6 uppercase tracking-[0.8em] text-sm mb-16 font-bold">Data_Integrity: 0.00%</p>
          <button onClick={handleRestart} className="group flex items-center gap-4 px-16 py-6 bg-white text-black font-black text-2xl hover:bg-[#FF003C] hover:text-white transition-all uppercase tracking-widest">
            <RotateCcw size={24} /> Re-Initialize
          </button>
        </div>
      )}

      {/* SIGNATURE */}
      <div className="fixed bottom-6 right-6 text-[10px] text-[#E056FD] opacity-30 flex flex-col items-end pointer-events-none">
        <span className="font-black tracking-widest uppercase">Architect // Void_Weaver</span>
        <span className="tracking-[0.2em]">SYS // VOIDSCAPER_v2.1_M2</span>
      </div>
    </div>
  );
};

export default App;