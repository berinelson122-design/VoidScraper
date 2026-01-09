import Phaser from 'phaser';
import { GameCallbacks } from '../config';

export default class MainScene extends Phaser.Scene {
  // Explicitly declare properties to satisfy TypeScript
  public input!: Phaser.Input.InputPlugin;
  public add!: Phaser.GameObjects.GameObjectFactory;
  public physics!: Phaser.Physics.Arcade.ArcadePhysics;
  public time!: Phaser.Time.Clock;
  public make!: Phaser.GameObjects.GameObjectCreator;
  public tweens!: Phaser.Tweens.TweenManager;
  public scene!: Phaser.Scenes.ScenePlugin;

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.GameObjects.TileSprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  
  private score: number = 0;
  private scoreTimer!: Phaser.Time.TimerEvent;
  private obstacleTimer!: Phaser.Time.TimerEvent;
  private gameSpeed: number = 5; // Base scroll speed
  private isGameOver: boolean = false;
  private jumps: number = 0;
  private callbacks: GameCallbacks;

  // Jump Mechanics (Coyote Time & Buffering)
  private jumpBufferTimer: number = 0;
  private coyoteTimeTimer: number = 0;
  private readonly JUMP_BUFFER_DELAY = 150; // ms
  private readonly COYOTE_DELAY = 100; // ms

  // Visual constants
  private readonly COLOR_BG = 0x1a1a1a;
  private readonly COLOR_PLATFORM = 0x39ff14;
  private readonly COLOR_PLAYER = 0x00f3ff;
  private readonly COLOR_SPIKE = 0xff003c;
  private readonly COLOR_SAW = 0xffaa00;   // Orange for rolling saws
  private readonly COLOR_DRONE = 0xd600ff; // Purple for flying drones
  
  constructor(callbacks: GameCallbacks) {
    super('MainScene');
    this.callbacks = callbacks;
  }

  create() {
    this.isGameOver = false;
    this.score = 0;
    this.gameSpeed = 5;
    this.jumps = 0;
    this.jumpBufferTimer = 0;
    this.coyoteTimeTimer = 0;
    
    // Setup inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // --- GRAPHICS GENERATION ---
    this.createAssets();

    // --- WORLD SETUP ---
    const groundHeight = 32;
    this.ground = this.add.tileSprite(400, 450 - groundHeight/2, 800, groundHeight, 'ground');
    
    // Physics platform (invisible, static)
    const platforms = this.physics.add.staticGroup();
    const platformBody = platforms.create(400, 450 - groundHeight/2, 'ground').refreshBody();
    platformBody.visible = false; 

    // Ceiling (invisible, prevents flying out)
    const ceiling = this.add.rectangle(400, -10, 800, 20, 0x000000);
    this.physics.add.existing(ceiling, true); 

    // --- PLAYER SETUP ---
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(30, 30);
    
    // --- OBSTACLES ---
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // --- COLLISIONS ---
    this.physics.add.collider(this.player, platforms, this.onGroundHit, undefined, this);
    this.physics.add.collider(this.player, ceiling);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);

    // --- TIMERS ---
    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: this.incrementScore,
      callbackScope: this,
      loop: true
    });

    this.spawnObstacle(); 
  }

  update() {
    if (this.isGameOver) return;

    const now = this.time.now;

    // 1. Update Coyote Time
    // If touching ground (or blocked down), extend the window where a ground jump is valid
    if (this.player.body.touching.down || this.player.body.blocked.down) {
      this.coyoteTimeTimer = now + this.COYOTE_DELAY;
    }

    // 2. Input Buffering
    // If key is pressed, open the jump buffer window
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.jumpBufferTimer = now + this.JUMP_BUFFER_DELAY;
    }

    // 3. Jump Logic
    // If we have a buffered input...
    if (this.jumpBufferTimer > now) {
      // Condition A: Ground Jump (via Coyote Time)
      // Must not have already jumped (jumps === 0 checks if we are grounded/reset)
      if (this.coyoteTimeTimer > now && this.jumps === 0) {
        this.executeJump();
      }
      // Condition B: Double Jump
      // Allow if we used 1 jump, AND we aren't currently "on ground" (prevents spamming double jump instantly on takeoff)
      else if (this.jumps > 0 && this.jumps < 2 && !this.player.body.touching.down) {
        this.executeJump();
      }
    }

    // Scroll the ground
    this.ground.tilePositionX += this.gameSpeed;

    // Update Obstacles (Move & Animate)
    this.obstacles.getChildren().forEach((obs: Phaser.GameObjects.GameObject) => {
      const obstacle = obs as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      obstacle.x -= this.gameSpeed;
      
      const type = obstacle.getData('type');

      // Behavior: Sawblade Rotation
      if (type === 'saw') {
        obstacle.rotation -= 0.15; // Roll left
      }
      
      // Behavior: Drone Sine Wave
      if (type === 'drone') {
        const startY = obstacle.getData('startY');
        // Bob up and down based on time
        obstacle.y = startY + Math.sin(this.time.now * 0.005) * 30;
      }

      // Cleanup if off screen
      if (obstacle.x < -50) {
        this.obstacles.remove(obstacle, true, true);
      }
    });
  }

  private createAssets() {
    // 1. Player
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(this.COLOR_PLAYER, 1);
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.lineStyle(2, 0xffffff, 0.5);
    playerGraphics.strokeRect(0, 0, 32, 32);
    playerGraphics.generateTexture('player', 32, 32);

    // 2. Ground
    const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    groundGraphics.fillStyle(0x000000, 1);
    groundGraphics.fillRect(0, 0, 800, 32);
    groundGraphics.lineStyle(2, this.COLOR_PLATFORM, 1);
    groundGraphics.beginPath();
    groundGraphics.moveTo(0, 1);
    groundGraphics.lineTo(800, 1);
    groundGraphics.strokePath();
    groundGraphics.generateTexture('ground', 800, 32);

    // 3. Spike (Triangle)
    const spikeGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    spikeGraphics.fillStyle(this.COLOR_SPIKE, 1);
    spikeGraphics.beginPath();
    spikeGraphics.moveTo(0, 32);
    spikeGraphics.lineTo(16, 0);
    spikeGraphics.lineTo(32, 32);
    spikeGraphics.closePath();
    spikeGraphics.fillPath();
    spikeGraphics.lineStyle(2, 0xff0000, 0.5);
    spikeGraphics.strokePath();
    spikeGraphics.generateTexture('spike', 32, 32);

    // 4. Sawblade (Circle with teeth logic simulation via graphics)
    const sawGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    sawGraphics.lineStyle(3, this.COLOR_SAW, 1);
    sawGraphics.fillStyle(0x000000, 1);
    sawGraphics.fillCircle(16, 16, 14);
    sawGraphics.strokeCircle(16, 16, 14);
    // Draw an 'X' to see rotation clearly
    sawGraphics.lineStyle(2, this.COLOR_SAW, 1);
    sawGraphics.moveTo(8, 8);
    sawGraphics.lineTo(24, 24);
    sawGraphics.moveTo(24, 8);
    sawGraphics.lineTo(8, 24);
    sawGraphics.strokePath();
    sawGraphics.generateTexture('saw', 32, 32);

    // 5. Drone (Diamond shape)
    const droneGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    droneGraphics.fillStyle(this.COLOR_DRONE, 1);
    droneGraphics.beginPath();
    droneGraphics.moveTo(16, 0);
    droneGraphics.lineTo(32, 16);
    droneGraphics.lineTo(16, 32);
    droneGraphics.lineTo(0, 16);
    droneGraphics.closePath();
    droneGraphics.fillPath();
    // Inner light
    droneGraphics.fillStyle(0xffffff, 0.8);
    droneGraphics.fillCircle(16, 16, 5);
    droneGraphics.generateTexture('drone', 32, 32);

    // 6. Particle
    const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillRect(0, 0, 4, 4);
    particleGraphics.generateTexture('particle', 4, 4);
  }

  private executeJump() {
    this.player.setVelocityY(-500);
    this.jumps++;
    this.emitJumpParticles();
    
    // Important: Consume buffers so we don't jump again immediately
    this.jumpBufferTimer = 0;
    this.coyoteTimeTimer = 0;
    
    // Rotate effect for double jump
    if (this.jumps === 2) {
      this.tweens.add({
        targets: this.player,
        angle: 360,
        duration: 400,
        ease: 'Power2'
      });
    }
  }

  private onGroundHit() {
    // Reset jump counter when touching ground
    // Only if moving downwards to avoid wall cling weirdness
    if (this.player.body.velocity.y >= 0) {
      this.jumps = 0;
      this.player.angle = 0; // Reset rotation
    }
  }

  private emitJumpParticles() {
    const emitter = this.add.particles(this.player.x, this.player.y + 16, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 45, max: 135 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      gravityY: 500,
      quantity: 5
    });
    
    this.time.delayedCall(300, () => {
        emitter.stop();
        this.time.delayedCall(300, () => emitter.destroy());
    });
  }

  private incrementScore() {
    if (this.isGameOver) return;
    this.score += 1;
    
    // Increase speed by 5% every 20 points
    if (this.score % 20 === 0) {
      this.gameSpeed *= 1.05;
    }
    
    this.callbacks.onScoreUpdate(this.score);
  }

  private spawnObstacle() {
    if (this.isGameOver) return;

    // Adjust delay based on speed so obstacles don't get too sparse or too dense
    // As speed increases, we reduce delay, but we ensure it doesn't get impossible
    const baseDelayMin = 1000;
    const baseDelayMax = 2500;
    
    // Scale delay down as speed goes up (base speed is 5)
    const speedFactor = 5 / this.gameSpeed; 
    
    const delay = Phaser.Math.Between(baseDelayMin * speedFactor, baseDelayMax * speedFactor);
    const finalDelay = Math.max(500, delay);

    this.obstacleTimer = this.time.addEvent({
      delay: finalDelay,
      callback: () => {
        if (this.isGameOver) return;
        
        // Randomly choose obstacle type based on score difficulty
        this.chooseObstacleType();
        
        this.spawnObstacle(); 
      },
      callbackScope: this
    });
  }

  private chooseObstacleType() {
    const chance = Phaser.Math.Between(0, 100);
    
    // Advanced difficulty (Score > 20): All types allowed
    if (this.score > 20) {
      if (chance < 40) this.createSpike();
      else if (chance < 70) this.createSawblade();
      else this.createDrone();
    }
    // Medium difficulty (Score > 10): Spikes and Sawblades
    else if (this.score > 10) {
      if (chance < 60) this.createSpike();
      else this.createSawblade();
    }
    // Easy difficulty: Only Spikes
    else {
      this.createSpike();
    }
  }

  private createSpike() {
    const isCeiling = Phaser.Math.Between(0, 100) > 80; 
    
    let y = 450 - 32 - 16; 
    let angle = 0;

    if (isCeiling) {
      y = 20 + 16;
      angle = 180;
    }

    const spike = this.obstacles.create(850, y, 'spike');
    spike.setAngle(angle);
    spike.setData('type', 'spike');
    spike.body.setSize(20, 20);
    spike.body.setOffset(6, 6);
  }

  private createSawblade() {
    // Rolling on the ground
    const y = 450 - 32 - 16; // Center of 32x32 sprite on top of 32px ground
    const saw = this.obstacles.create(850, y, 'saw');
    saw.setData('type', 'saw');
    // Circle collision
    saw.body.setCircle(14, 2, 2);
  }

  private createDrone() {
    // Flying at random mid-heights
    const minY = 150;
    const maxY = 350;
    const startY = Phaser.Math.Between(minY, maxY);
    
    const drone = this.obstacles.create(850, startY, 'drone');
    drone.setData('type', 'drone');
    drone.setData('startY', startY); // Store start Y for sine wave calculation
    // Diamond approximate collision
    drone.body.setCircle(12, 4, 4);
  }

  private hitObstacle() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    this.physics.pause();
    this.player.setTint(0xff0000);
    
    this.add.particles(this.player.x, this.player.y, 'particle', {
      speed: { min: 50, max: 200 },
      scale: { start: 1.5, end: 0 },
      lifespan: 800,
      quantity: 30,
      blendMode: 'ADD'
    });

    this.callbacks.onGameOver(this.score);
  }

  public restartGame() {
    this.scene.restart();
  }
}