import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { 
  createConfig, 
  DIFFICULTIES, 
  DifficultyLevel, 
  DifficultyConfig,
  ActivePowerUpInfo 
} from './game/config';
import MainScene from './game/scenes/MainScene';
import { AudioEngine } from './game/systems/AudioEngine';
import { 
  Activity, 
  ShieldAlert, 
  RotateCcw, 
  Play, 
  Zap, 
  Gauge, 
  Flame, 
  Smartphone, 
  Monitor, 
  Trophy, 
  ChevronRight, 
  LayoutGrid,
  Home,
  Shield,
  Tv
} from 'lucide-react';

// ===== DIFFICULTY & START MENU FEATURE START =====
type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';
// ===== DIFFICULTY & START MENU FEATURE END =====

const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // ===== DIFFICULTY & START MENU FEATURE START =====
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('cyber_ninja_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // ===== SCANLINE TOGGLE FEATURE START =====
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyber_ninja_scanlines');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleScanlines = () => {
    audioEngineRef.current?.playSelect();
    setScanlinesEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('cyber_ninja_scanlines', String(next));
      return next;
    });
  };
  // ===== SCANLINE TOGGLE FEATURE END =====

  // ===== POWER-UP SYSTEM FEATURE START =====
  const [activePowerUp, setActivePowerUp] = useState<ActivePowerUpInfo | null>(null);
  // ===== POWER-UP SYSTEM FEATURE END =====

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
  }, []);

  const currentDiffConfig: DifficultyConfig = DIFFICULTIES[selectedDifficulty];

  // Initialize or handle Phaser game engine when entering PLAYING state
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (!gameRef.current) return;

    // Clear previous ghost canvases if creating fresh instance
    if (!gameInstanceRef.current) {
      gameRef.current.innerHTML = '';
      const config = createConfig(
        gameRef.current,
        {
          onScore: (s) => setScore(s),
          onDeath: (finalScore) => {
            setScore(finalScore);
            setActivePowerUp(null);
            setHighScore((prev) => {
              if (finalScore > prev) {
                localStorage.setItem('cyber_ninja_high_score', finalScore.toString());
                setIsNewHighScore(true);
                return finalScore;
              }
              setIsNewHighScore(false);
              return prev;
            });
            setGameState('GAME_OVER');
          },
          // ===== POWER-UP SYSTEM FEATURE START =====
          onPowerUpChange: (info) => {
            setActivePowerUp(info);
          }
          // ===== POWER-UP SYSTEM FEATURE END =====
        },
        currentDiffConfig
      );

      gameInstanceRef.current = new Phaser.Game(config);
    } else {
      // Re-run scene with selected difficulty
      const scene = gameInstanceRef.current.scene.getScene('MainScene') as MainScene;
      if (scene) {
        scene.restart(currentDiffConfig);
      }
    }

    return () => {
      // Clean up game instance when App unmounts
    };
  }, [gameState]);

  const handleSelectDifficulty = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    audioEngineRef.current?.playSelect();
  };

  const handleStartGame = () => {
    audioEngineRef.current?.playStart();
    setScore(0);
    setActivePowerUp(null);
    setIsNewHighScore(false);
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    audioEngineRef.current?.playStart();
    setScore(0);
    setActivePowerUp(null);
    setIsNewHighScore(false);
    if (gameInstanceRef.current) {
      const scene = gameInstanceRef.current.scene.getScene('MainScene') as MainScene;
      if (scene) {
        scene.restart(currentDiffConfig);
      }
      setGameState('PLAYING');
    } else {
      setGameState('PLAYING');
    }
  };

  const handleReturnToMenu = () => {
    audioEngineRef.current?.playSelect();
    setActivePowerUp(null);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }
    setGameState('MENU');
  };
  // ===== DIFFICULTY & START MENU FEATURE END =====

  return (
    <div id="app-root" className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-mono selection:bg-[#FF003C]">

      {/* ===== SCANLINE TOGGLE FEATURE START ===== */}
      {scanlinesEnabled && <div id="scanline-overlay" className="scanlines" />}
      {/* ===== SCANLINE TOGGLE FEATURE END ===== */}

      {/* CANVAS CONTAINER */}
      <div
        id="game-canvas-container"
        ref={gameRef}
        className={`relative z-10 w-full max-w-4xl aspect-video border-4 border-[#111] shadow-[0_0_50px_rgba(224,86,253,0.1)] transition-opacity duration-300 ${
          gameState === 'MENU' ? 'opacity-20 pointer-events-none' : 'opacity-100'
        }`}
      />

      {/* ===== DIFFICULTY & START MENU FEATURE START ===== */}
      {/* 1. START MENU OVERLAY */}
      {gameState === 'MENU' && (
        <div id="start-menu-overlay" className="absolute inset-0 bg-black/90 backdrop-blur-md z-[80] flex flex-col items-center justify-between p-6 sm:p-10 overflow-y-auto">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col items-center text-center mt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#E056FD]/40 text-[#E056FD] text-xs font-bold uppercase tracking-[0.3em] rounded-full mb-3 shadow-[0_0_15px_rgba(224,86,253,0.2)]">
              <Zap size={14} className="text-[#FF003C] animate-pulse" />
              <span>VOIDSCAPER // RUNNER_SYSTEM_v2.5</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter italic uppercase drop-shadow-[0_0_20px_rgba(224,86,253,0.6)]">
              CYBER-NINJA <span className="text-[#FF003C]">RUN</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#A0A0A0] uppercase tracking-[0.4em] mt-2 font-semibold">
              KINETIC 2D ENDLESS RUNNER // CHOOSE DIFFICULTY TO INITIATE
            </p>

            {/* HIGH SCORE & SCANLINE TOGGLE BAR */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {highScore > 0 && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-[#111] border border-[#00F3FF]/40 text-[#00F3FF] text-xs font-bold uppercase tracking-widest rounded shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                  <Trophy size={16} className="text-[#00F3FF]" />
                  <span>PERSONAL BEST: <strong className="text-white text-sm">{highScore.toString().padStart(6, '0')}</strong></span>
                </div>
              )}

              {/* ===== SCANLINE TOGGLE FEATURE START ===== */}
              <button
                onClick={toggleScanlines}
                className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer ${
                  scanlinesEnabled 
                    ? 'bg-[#111] border-[#00F3FF] text-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.25)]' 
                    : 'bg-[#080808] border-[#333] text-[#777] hover:border-[#666]'
                }`}
                title="Toggle CRT Scanline Overlay"
              >
                <Tv size={14} />
                <span>SCANLINES: {scanlinesEnabled ? 'ENABLED' : 'DISABLED'}</span>
              </button>
              {/* ===== SCANLINE TOGGLE FEATURE END ===== */}
            </div>
          </div>

          {/* DIFFICULTY SELECTOR GRID */}
          <div className="w-full max-w-3xl my-5">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E056FD] font-bold flex items-center gap-2">
                <Gauge size={14} /> SELECT SYSTEM DIFFICULTY
              </span>
              <span className="text-[10px] text-[#666] tracking-widest uppercase">
                PHYSICS & SPEED PARAMETERS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(DIFFICULTIES) as DifficultyLevel[]).map((level) => {
                const config = DIFFICULTIES[level];
                const isSelected = selectedDifficulty === level;

                return (
                  <button
                    key={level}
                    onClick={() => handleSelectDifficulty(level)}
                    className={`relative p-5 text-left border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between group rounded-sm ${
                      isSelected
                        ? `bg-black border-[${config.color}] shadow-[0_0_25px_${config.color}40]`
                        : 'bg-[#080808] border-[#222] hover:border-[#444] opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: isSelected ? config.color : undefined,
                      boxShadow: isSelected ? `0 0 25px ${config.color}33` : undefined
                    }}
                  >
                    {/* Top Status Tag */}
                    <div className="flex items-center justify-between mb-3">
                      <span 
                        className="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm"
                        style={{ backgroundColor: config.badgeBg, color: config.color }}
                      >
                        {config.label}
                      </span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: config.color }} />
                      )}
                    </div>

                    {/* Tagline & Description */}
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                        {config.tagline}
                      </div>
                      <p className="text-[11px] text-[#888] leading-relaxed mb-4">
                        {config.description}
                      </p>
                    </div>

                    {/* Stat Metrics */}
                    <div className="pt-3 border-t border-[#1e1e1e] space-y-1 text-[10px] uppercase tracking-wider">
                      <div className="flex justify-between text-[#aaa]">
                        <span>BASE VELOCITY:</span>
                        <span className="font-bold text-white">{config.baseSpeed} PX/S</span>
                      </div>
                      <div className="flex justify-between text-[#aaa]">
                        <span>GRAVITY FORCE:</span>
                        <span className="font-bold text-white">{config.gravity} G</span>
                      </div>
                      <div className="flex justify-between text-[#aaa]">
                        <span>SPAWN FREQ:</span>
                        <span className="font-bold text-white">{(config.spawnDelay / 1000).toFixed(1)}S</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== POWER-UP SYSTEM FEATURE START ===== */}
          {/* POWER-UP DIRECTIVE BANNER */}
          <div className="w-full max-w-3xl bg-[#080808] border border-[#222] p-3 rounded-sm flex flex-col sm:flex-row items-center justify-around gap-3 mb-4 text-[11px]">
            <div className="flex items-center gap-2 text-[#00F3FF]">
              <Shield size={16} />
              <span><strong className="text-white">SHIELD MATRIX:</strong> Absorbs lethal obstacle impacts</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-[#222]" />
            <div className="flex items-center gap-2 text-[#FFE600]">
              <Zap size={16} />
              <span><strong className="text-white">OVERDRIVE BOOST:</strong> High speed, destroys hazards & 2x score</span>
            </div>
          </div>
          {/* ===== POWER-UP SYSTEM FEATURE END ===== */}

          {/* CONTROLS GUIDE (MOBILE & PC) */}
          <div className="w-full max-w-3xl bg-[#080808] border border-[#222] p-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 w-full sm:w-1/2">
              <Monitor size={20} className="text-[#00F3FF] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">PC CONTROLS</div>
                <div className="text-[11px] text-[#888]">Press <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#333] text-white rounded text-[10px] font-bold">SPACE</kbd> or <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#333] text-white rounded text-[10px] font-bold">LEFT CLICK</kbd> to Jump & Double-Jump</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-[#222]" />

            <div className="flex items-center gap-3 w-full sm:w-1/2">
              <Smartphone size={20} className="text-[#E056FD] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">MOBILE CONTROLS</div>
                <div className="text-[11px] text-[#888]">Tap anywhere on <span className="text-white font-semibold">Touch Screen</span> to Jump & Double-Jump</div>
              </div>
            </div>
          </div>

          {/* START BUTTON */}
          <button
            onClick={handleStartGame}
            className="w-full max-w-md py-5 bg-white text-black font-black text-xl hover:bg-[#FF003C] hover:text-white transition-all duration-300 uppercase tracking-widest shadow-[0_10px_40px_rgba(255,0,60,0.4)] flex items-center justify-center gap-3 cursor-pointer group mb-2"
          >
            <Play size={24} className="fill-current group-hover:scale-110 transition-transform" />
            <span>INITIATE RUN // [{selectedDifficulty}]</span>
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      )}
      {/* ===== DIFFICULTY & START MENU FEATURE END ===== */}

      {/* HUD: SYSTEM STATUS (Visible in PLAYING mode) */}
      {gameState === 'PLAYING' && (
        <div id="hud-system-status" className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none z-40">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#E056FD]">
              <Activity size={16} className="animate-pulse" />
              <span className="text-xs uppercase tracking-[0.4em] font-black">Core_Clock_Signal</span>
            </div>
            <div id="score-display" className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_#E056FD]">
              {score.toString().padStart(6, '0')}
            </div>

            {/* ===== POWER-UP SYSTEM FEATURE START ===== */}
            {/* ACTIVE POWER-UP HUD BADGE */}
            {activePowerUp && (
              <div 
                className="mt-2 inline-flex items-center gap-2.5 px-3 py-1.5 border backdrop-blur-md rounded shadow-lg animate-in fade-in slide-in-from-left-2 duration-200"
                style={{
                  borderColor: activePowerUp.color,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  boxShadow: `0 0 15px ${activePowerUp.color}40`
                }}
              >
                {activePowerUp.type === 'SHIELD' ? (
                  <Shield size={16} className="animate-pulse" style={{ color: activePowerUp.color }} />
                ) : (
                  <Zap size={16} className="animate-bounce" style={{ color: activePowerUp.color }} />
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: activePowerUp.color }}>
                    {activePowerUp.label}
                  </span>
                  {activePowerUp.durationMs > 1 && (
                    <div className="w-32 bg-[#222] h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full transition-all duration-100"
                        style={{ 
                          width: `${Math.max(0, (activePowerUp.timeRemainingMs / activePowerUp.durationMs) * 100)}%`,
                          backgroundColor: activePowerUp.color
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ===== POWER-UP SYSTEM FEATURE END ===== */}
          </div>

          {/* HUD ACTIVE DIFFICULTY BADGE, SCANLINES & MENU BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <div 
              className="px-3 py-1.5 border font-black text-xs uppercase tracking-widest rounded-sm backdrop-blur-md shadow-lg"
              style={{ 
                borderColor: currentDiffConfig.color, 
                color: currentDiffConfig.color,
                backgroundColor: 'rgba(0,0,0,0.7)'
              }}
            >
              MODE: {currentDiffConfig.name}
            </div>

            {/* ===== SCANLINE TOGGLE FEATURE START ===== */}
            <button
              onClick={toggleScanlines}
              className={`px-2.5 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 backdrop-blur-md ${
                scanlinesEnabled 
                  ? 'bg-black/80 border-[#00F3FF] text-[#00F3FF]' 
                  : 'bg-black/80 border-[#333] text-[#777] hover:border-[#666]'
              }`}
              title="Toggle Scanlines"
            >
              <Tv size={14} />
              <span className="hidden sm:inline">CRT: {scanlinesEnabled ? 'ON' : 'OFF'}</span>
            </button>
            {/* ===== SCANLINE TOGGLE FEATURE END ===== */}

            <button
              onClick={handleReturnToMenu}
              className="px-3 py-1.5 bg-black/80 hover:bg-[#FF003C] border border-[#333] hover:border-[#FF003C] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LayoutGrid size={14} />
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== DIFFICULTY & START MENU FEATURE START ===== */}
      {/* TERMINAL OVERLAY: SYNC LOST (Game Over) */}
      {gameState === 'GAME_OVER' && (
        <div id="sync-lost-overlay" className="absolute inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <ShieldAlert size={72} className="text-[#FF003C] mb-4 animate-bounce" />
          
          <h1 className="text-6xl sm:text-8xl font-black text-[#FF003C] tracking-tighter italic uppercase drop-shadow-[4px_4px_0px_#fff]">
            Sync Lost
          </h1>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-[#E056FD] uppercase tracking-[0.6em] text-xs sm:text-sm font-bold">
              SYSTEM_DIFFICULTY: <span className="text-white">{currentDiffConfig.label}</span>
            </p>
            
            <div className="text-3xl sm:text-4xl font-black text-white tracking-widest my-2">
              SCORE: <span className="text-[#00F3FF]">{score.toString().padStart(6, '0')}</span>
            </div>

            {isNewHighScore ? (
              <div className="px-4 py-1 bg-[#FF003C] text-white text-xs font-black uppercase tracking-[0.3em] animate-pulse rounded-sm mb-4">
                ★ NEW HIGH SCORE RECORD ACHIEVED! ★
              </div>
            ) : (
              <div className="text-xs text-[#888] uppercase tracking-widest mb-4">
                BEST SCORE: {highScore.toString().padStart(6, '0')}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              id="re-initialize-button"
              onClick={handleRestart}
              className="group flex items-center justify-center gap-3 px-10 py-5 bg-white text-black font-black text-xl hover:bg-[#FF003C] hover:text-white transition-all uppercase tracking-widest shadow-[0_10px_40px_rgba(255,0,60,0.4)] cursor-pointer"
            >
              <RotateCcw size={22} className="group-hover:rotate-180 transition-transform duration-500" />
              Re-Initialize
            </button>

            <button
              onClick={handleReturnToMenu}
              className="group flex items-center justify-center gap-3 px-8 py-5 bg-[#111] hover:bg-[#222] border border-[#333] hover:border-[#E056FD] text-white font-black text-lg transition-all uppercase tracking-widest cursor-pointer"
            >
              <Home size={20} className="text-[#E056FD]" />
              Start Menu
            </button>
          </div>
        </div>
      )}
      {/* ===== DIFFICULTY & START MENU FEATURE END ===== */}

      {/* PERSISTENT WATERMARK */}
      <div id="watermark-info" className="fixed bottom-6 right-6 text-[10px] text-[#E056FD] opacity-30 flex flex-col items-end pointer-events-none z-[200]">
        <span className="font-black tracking-widest">ARCHITECT // VOID_WEAVER</span>
        <span className="tracking-[0.2em]">SYS // VOIDSCAPER_v2.5_M2</span>
      </div>

    </div>
  );
};

export default App;