import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createConfig } from './game/config';
import MainScene from './game/scenes/MainScene';
import { Activity, ShieldAlert, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [isDead, setIsDead] = useState(false);

  useEffect(() => {
    // 1. HARDWARE CHECK: Ensure the DOM element exists
    if (!gameRef.current) return;

    // 2. CLEAR THE BUFFER: Remove any "Ghost" canvases from previous renders
    gameRef.current.innerHTML = '';

    // 3. INITIALIZE ENGINE
    const config = createConfig(gameRef.current, {
      onScore: (s) => setScore(s),
      onDeath: (s) => setIsDead(true)
    });

    const game = new Phaser.Game(config);

    // 4. CLEANUP: Destroy the engine when the component unmounts
    return () => {
      game.destroy(true);
    };
  }, []); // Empty dependency array ensures this only runs ONCE

  const handleRestart = () => {
    // To cleanly restart, we simply reload the page for now to ensure memory is dumped
    window.location.reload();
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-mono selection:bg-[#FF003C]">

      {/* SCANLINE OVERLAY */}
      <div className="scanlines" />

      {/* CANVAS CONTAINER (Must be positioned relative and have dimensions) */}
      <div
        ref={gameRef}
        className="relative z-10 w-full max-w-4xl aspect-video border-4 border-[#111] shadow-[0_0_50px_rgba(224,86,253,0.1)]"
      />

      {/* HUD: SYSTEM STATUS */}
      <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none z-40">
        <div className="flex items-center gap-2 text-[#E056FD]">
          <Activity size={16} className="animate-pulse" />
          <span className="text-xs uppercase tracking-[0.4em] font-black">Core_Clock_Signal</span>
        </div>
        <div className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_#E056FD]">
          {score.toString().padStart(6, '0')}
        </div>
      </div>

      {/* TERMINAL OVERLAY: SYNC LOST */}
      {isDead && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <ShieldAlert size={80} className="text-[#FF003C] mb-6 animate-bounce" />
          <h1 className="text-9xl font-black text-[#FF003C] tracking-tighter italic uppercase drop-shadow-[4px_4px_0px_#fff]">
            Sync Lost
          </h1>
          <p className="text-[#E056FD] mt-6 uppercase tracking-[0.8em] text-sm mb-16 font-bold">
            Data_Integrity: 0.00% // Score: {score}
          </p>

          <button
            onClick={handleRestart}
            className="group flex items-center gap-4 px-16 py-6 bg-white text-black font-black text-2xl hover:bg-[#FF003C] hover:text-white transition-all uppercase tracking-widest shadow-[0_10px_40px_rgba(255,0,60,0.4)]"
          >
            <RotateCcw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
            Re-Initialize
          </button>
        </div>
      )}

      {/* PERSISTENT WATERMARK */}
      <div className="fixed bottom-6 right-6 text-[10px] text-[#E056FD] opacity-30 flex flex-col items-end pointer-events-none z-[200]">
        <span className="font-black tracking-widest">ARCHITECT // VOID_WEAVER</span>
        <span className="tracking-[0.2em]">SYS // VOIDSCAPER_v2.5_M2</span>
      </div>

    </div>
  );
};

export default App;