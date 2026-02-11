import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createConfig } from '../game/config';
import MainScene from '../game/scenes/MainScene';
import { Play, RotateCcw } from 'lucide-react';

export const GameRunner: React.FC = () => {
  const parentEl = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!start || !parentEl.current) return;
    
    const config = createConfig(parentEl.current, {
        onDeath: (s) => { setScore(s); setDead(true); },
        onScore: (s) => setScore(s)
    });
    gameRef.current = new Phaser.Game(config);

    return () => { gameRef.current?.destroy(true); };
  }, [start]);

  const reboot = () => {
      if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
          scene.scene.restart();
          setDead(false); setScore(0);
      }
  };

  return (
    <div className="relative w-full max-w-4xl aspect-video bg-[#050505] border-2 border-[#333] shadow-[0_0_40px_rgba(0,243,255,0.2)] rounded-sm overflow-hidden font-mono">
      
      {/* GAME VIEW */}
      {!start ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
              <h1 className="text-6xl font-black text-[#00f3ff] italic tracking-tighter mb-6 drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
                  VOID<span className="text-[#39ff14]">SCAPER</span>
              </h1>
              <button onClick={() => setStart(true)} className="px-8 py-3 bg-[#39ff14] hover:bg-[#32d912] text-black font-bold text-xl uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2">
                  <Play size={24} /> Initiate Run
              </button>
          </div>
      ) : <div ref={parentEl} className="w-full h-full" />}

      {/* HUD */}
      {start && (
          <div className="absolute top-4 left-6 pointer-events-none">
              <div className="text-[10px] text-[#39ff14] font-bold tracking-[0.2em] mb-0">VELOCITY_METRIC</div>
              <div className="text-4xl font-black text-white drop-shadow-md">{score.toString().padStart(4, '0')}</div>
          </div>
      )}

      {/* GAME OVER */}
      {dead && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in duration-200">
              <div className="text-[#ff003c] text-6xl font-black tracking-tighter mb-2 animate-pulse">SYNC LOST</div>
              <div className="text-white text-xl mb-8">FINAL METRIC: <span className="text-[#39ff14]">{score}</span></div>
              <button onClick={reboot} className="px-8 py-3 border-2 border-white hover:bg-white hover:text-black text-white font-bold uppercase transition-all flex items-center gap-2">
                  <RotateCcw size={20}/> Reconnect
              </button>
          </div>
      )}

      {/* WATERMARK */}
      <div className="absolute bottom-2 right-4 text-[10px] text-[#00f3ff] opacity-40 pointer-events-none tracking-widest">
          ARCHITECT // VOID_WEAVER
      </div>
    </div>
  );
};