/**
 * VOID_WEAVER // SCENE_LOGIC
 * MECHANIC: INFINITE_RUNNER_V2
 */
import Phaser from 'phaser';
import { SoundManager } from './SoundManager';

export default class MainScene extends Phaser.Scene {
  private p!: Phaser.GameObjects.Rectangle; // Player
  private g!: Phaser.GameObjects.Rectangle; // Ground
  private obs!: Phaser.GameObjects.Group;   // Obstacles
  private parts!: Phaser.GameObjects.Group; // Particles
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  private spd = 6.5; // Base Speed
  private score = 0;
  private jumps = 0;
  private dead = false;
  private audio = new SoundManager();
  
  private cb: any;

  constructor(cb: any) {
    super('MainScene');
    this.cb = cb;
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.audio.init();

    // 1. ENVIRONMENT
    this.g = this.add.rectangle(w/2, h-20, w, 40, 0x39ff14); // Neon Green
    this.physics.add.existing(this.g, true);

    // 2. PLAYER
    this.p = this.add.rectangle(100, h-100, 30, 30, 0x00f3ff); // Cyan Core
    this.physics.add.existing(this.p);
    (this.p.body as Phaser.Physics.Arcade.Body).setGravityY(2000).setCollideWorldBounds(true);

    // 3. GROUPS
    this.obs = this.add.group();
    this.parts = this.add.group();

    // 4. INPUTS
    this.keys = this.input.keyboard!.createCursorKeys();
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard!.on('keydown-SPACE', this.jump, this);
    this.input.keyboard!.on('keydown-UP', this.jump, this);

    // 5. COLLISION
    this.physics.add.collider(this.p, this.g, () => this.jumps = 0);
    
    // 6. SPAWNER (Procedural)
    this.time.addEvent({ delay: 1200, callback: this.spawn, callbackScope: this, loop: true });
  }

  update() {
    if (this.dead) return;
    
    // Speed Ramp
    this.spd = 6.5 + (this.score * 0.005); 

    // Move Obstacles
    this.obs.getChildren().forEach((o: any) => {
      o.x -= this.spd;
      if (o.x < -50) { o.destroy(); this.addScore(); }
    });

    // Particle Trail
    if (this.time.now % 5 === 0) {
        const t = this.add.rectangle(this.p.x, this.p.y, 4, 4, 0x00f3ff);
        this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    }

    // Hit Check
    if (this.physics.overlap(this.p, this.obs)) this.die();
  }

  jump() {
    if (this.dead) { this.scene.restart(); this.dead = false; this.score = 0; this.spd = 6.5; return; }
    if (this.jumps < 2) {
      const body = this.p.body as Phaser.Physics.Arcade.Body;
      body.setVelocityY(this.jumps === 0 ? -700 : -600);
      this.jumps++;
      
      // Visual Spin
      this.tweens.add({ targets: this.p, angle: this.p.angle + 90, duration: 200 });
      this.jumps === 1 ? this.audio.jump() : this.audio.doubleJump();
    }
  }

  spawn() {
    if (this.dead) return;
    const { width: w, height: h } = this.scale;
    const isFly = Math.random() > 0.7; // 30% Fly Chance

    let o: Phaser.GameObjects.Shape;
    if (isFly) {
        // Drone
        o = this.add.rectangle(w, h-100, 30, 30, 0xff003c); // Red
        this.physics.add.existing(o);
        (o.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    } else {
        // Spike
        o = this.add.triangle(w, h-60, 0, 40, 20, 0, 40, 40, 0xff003c);
        this.physics.add.existing(o);
        (o.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
    this.obs.add(o);
  }

  addScore() {
    this.score++;
    if (this.score % 10 === 0) this.audio.score();
    this.cb.onScore(this.score);
  }

  die() {
    this.dead = true;
    this.audio.crash();
    this.physics.pause();
    this.p.setFillStyle(0xff003c); // Red Dead
    this.cameras.main.shake(200, 0.05);
    this.cb.onDeath(this.score);
  }
}