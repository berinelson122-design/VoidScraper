import Phaser from 'phaser';
import { SoundManager } from './SoundManager';

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private ground!: Phaser.GameObjects.Rectangle;
  private obstacles!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  // Game State
  private gameSpeed: number = 5;
  private baseSpeed: number = 5;
  private score: number = 0;
  private isGameOver: boolean = false;
  private jumps: number = 0;
  
  // Audio
  private soundManager: SoundManager;

  // Callbacks
  private onGameOver?: (score: number) => void;
  private onScoreUpdate?: (score: number) => void;

  constructor() {
    super('MainScene');
    this.soundManager = new SoundManager();
  }

  init(data: { onGameOver: (score: number) => void; onScoreUpdate: (score: number) => void }) {
    this.onGameOver = data.onGameOver;
    this.onScoreUpdate = data.onScoreUpdate;
    this.score = 0;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;
  }

  create() {
    const { width, height } = this.scale;

    // 1. The Ground (Neon Green)
    this.ground = this.add.rectangle(width / 2, height - 20, width, 40, 0x39ff14);
    this.physics.add.existing(this.ground, true); // Static body

    // 2. The Player (Cyan Cube)
    this.player = this.add.rectangle(100, height - 100, 40, 40, 0x00f3ff);
    this.physics.add.existing(this.player);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setGravityY(1000);
    playerBody.setCollideWorldBounds(true);

    // 3. Obstacles Group
    this.obstacles = this.add.group();

    // 4. Inputs
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-SPACE', this.jump, this);

    // 5. Colliders
    this.physics.add.collider(this.player, this.ground, () => {
      this.jumps = 0; // Reset double jump on land
    });

    // 6. Spawner Loop
    this.time.addEvent({
      delay: 1500, // Spawn every 1.5 seconds initially
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    if (this.isGameOver) return;

    // --- GAME LOOP ---

    // 1. Move Obstacles
    this.obstacles.getChildren().forEach((obstacle) => {
      const body = obstacle.body as Phaser.Physics.Arcade.Body;
      body.x -= this.gameSpeed; // Move left based on current speed

      // Cleanup
      if (body.x < -50) {
        this.obstacles.killAndHide(obstacle);
        obstacle.destroy();
        this.incrementScore();
      }
    });

    // 2. Collision Check
    this.physics.overlap(this.player, this.obstacles, () => {
      this.gameOver();
    });
  }

  jump() {
    if (this.isGameOver) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Double Jump Logic
    if (this.jumps < 2) {
      body.setVelocityY(-500);
      this.jumps++;
      
      if (this.jumps === 1) this.soundManager.playJump();
      if (this.jumps === 2) this.soundManager.playDoubleJump();
      
      // Visual feedback (spin)
      this.tweens.add({
        targets: this.player,
        angle: this.player.angle + 90,
        duration: 200
      });
    }
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const { width, height } = this.scale;

    // RNG: 20% chance of Flying Enemy, 80% Ground Spike
    const isFlying = Math.random() > 0.8;

    let obstacle;
    if (isFlying) {
      // Flying Enemy (Red Triangle pointing down)
      // Height: Player must jump OR duck (if ducking existed), or just don't jump too high
      // Here we put it at head height so you have to time it right
      obstacle = this.add.triangle(width, height - 110, 0, 0, 20, 40, 40, 0, 0xff003c);
      this.physics.add.existing(obstacle);
      (obstacle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); // It floats
    } else {
      // Ground Spike (Red Triangle pointing up)
      obstacle = this.add.triangle(width, height - 60, 0, 40, 20, 0, 40, 40, 0xff003c);
      this.physics.add.existing(obstacle);
      (obstacle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); 
    }

    this.obstacles.add(obstacle);
  }

  incrementScore() {
    this.score += 10;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    
    // SFX
    if (this.score % 50 === 0) this.soundManager.playScore();

    // --- PROGRESSIVE DIFFICULTY (THE MATH) ---
    // Increase speed by 5% every 150 points
    if (this.score > 0 && this.score % 150 === 0) {
      this.gameSpeed = this.gameSpeed * 1.05;
      console.log(`Speed Up! New Speed: ${this.gameSpeed.toFixed(2)}`);
      
      // Visual Flash to indicate speed up
      this.cameras.main.flash(500, 30, 30, 30);
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.soundManager.playCrash();
    this.physics.pause();
    this.player.setFillStyle(0xff0000); // Turn player red
    if (this.onGameOver) this.onGameOver(this.score);
  }

  restartGame() {
    this.scene.restart();
  }
}