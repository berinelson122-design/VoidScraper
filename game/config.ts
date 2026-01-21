/**
 * VOID_WEAVER // PHYSICS_CORE
 * CONFIG: VS_V2_M2
 */
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

export interface Callbacks {
  onDeath: (score: number) => void;
  onScore: (score: number) => void;
}

export const createConfig = (parent: HTMLElement, cb: Callbacks): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent,
  backgroundColor: '#050505', // Deep Void
  fps: { target: 60, forceSetTimeOut: true }, // Lock 60 on Mac
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1600 }, // Heavy gravity for snappy jumps
      debug: false
    }
  },
  scene: [new MainScene(cb)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});