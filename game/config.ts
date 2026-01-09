import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

export interface GameCallbacks {
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export const createGameConfig = (
  parent: HTMLElement, 
  callbacks: GameCallbacks
): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: parent,
    backgroundColor: '#1a1a1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1000 },
        debug: false, 
      },
    },
    scene: [new MainScene(callbacks)],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true
    }
  };
};