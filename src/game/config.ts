/**
 * VOID_WEAVER // PHYSICS_CORE
 * CONFIG: VS_V2_M2
 */
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

// ===== DIFFICULTY & START MENU FEATURE START =====
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  name: DifficultyLevel;
  label: string;
  tagline: string;
  baseSpeed: number;
  gravity: number;
  jumpForce: number;
  spawnDelay: number;
  speedScaleFactor: number;
  description: string;
  color: string;
  badgeBg: string;
}

export const DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  EASY: {
    name: 'EASY',
    label: 'EASY // RECON',
    tagline: 'FLOATY & ACCESSIBLE',
    baseSpeed: 300,
    gravity: 1300,
    jumpForce: -600,
    spawnDelay: 1800,
    speedScaleFactor: 10,
    description: 'Reduced runner velocity, floaty jumps & spaced-out hazard spawns.',
    color: '#00F3FF',
    badgeBg: 'rgba(0, 243, 255, 0.15)'
  },
  MEDIUM: {
    name: 'MEDIUM',
    label: 'MEDIUM // OVERCLOCK',
    tagline: 'STANDARD KINETIC',
    baseSpeed: 420,
    gravity: 1600,
    jumpForce: -650,
    spawnDelay: 1400,
    speedScaleFactor: 20,
    description: 'Standard cyber-ninja speed, balanced gravity & tight obstacle rhythm.',
    color: '#E056FD',
    badgeBg: 'rgba(224, 86, 253, 0.15)'
  },
  HARD: {
    name: 'HARD',
    label: 'HARD // HYPERDRIVE',
    tagline: 'ULTRA FAST & HEAVY',
    baseSpeed: 560,
    gravity: 1950,
    jumpForce: -710,
    spawnDelay: 1000,
    speedScaleFactor: 35,
    description: 'High-octane sprint, heavy snappy gravity & rapid multi-hazard spawns.',
    color: '#FF003C',
    badgeBg: 'rgba(255, 0, 60, 0.15)'
  }
};
// ===== DIFFICULTY & START MENU FEATURE END =====

// ===== POWER-UP SYSTEM FEATURE START =====
export type PowerUpType = 'SHIELD' | 'SPEED_BOOST';

export interface ActivePowerUpInfo {
  type: PowerUpType;
  label: string;
  color: string;
  durationMs: number;
  timeRemainingMs: number;
}
// ===== POWER-UP SYSTEM FEATURE END =====

export interface Callbacks {
  onDeath: (score: number) => void;
  onScore: (score: number) => void;
  // ===== POWER-UP SYSTEM FEATURE START =====
  onPowerUpChange?: (info: ActivePowerUpInfo | null) => void;
  // ===== POWER-UP SYSTEM FEATURE END =====
}

export const createConfig = (
  parent: HTMLElement,
  cb: Callbacks,
  initialDifficulty: DifficultyConfig = DIFFICULTIES.MEDIUM
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent,
  backgroundColor: '#050505', // Deep Void
  fps: { target: 60, forceSetTimeOut: true }, // Lock 60 on Mac
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: initialDifficulty.gravity }, // Dynamic gravity per difficulty
      debug: false
    }
  },
  scene: [new MainScene(cb, initialDifficulty)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});