import Phaser from 'phaser';
import { AudioEngine } from '../systems/AudioEngine';

export interface Callbacks {
    onScore: (score: number) => void;
    onDeath: (score: number) => void;
}

export default class MainScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private floor!: Phaser.GameObjects.Rectangle;
    private audio!: AudioEngine;
    private callbacks: Callbacks;
    private gameSpeed: number = 400;
    private score: number = 0;
    private isDead: boolean = false;
    private jumpCount: number = 0; // State Machine for Double Jump
    private floorY: number = 0;

    constructor(cb: Callbacks) {
        super('MainScene');
        this.callbacks = cb;
    }

    create() {
        this.audio = new AudioEngine();
        const { width, height } = this.scale;

        // 1. DEFINE THE HARD FLOOR
        this.floorY = height - 100;

        // Visual Grid
        this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x000000, 0, 0xE056FD, 0.1);

        // 2. THE GROUND (Static Physics Object)
        this.floor = this.add.rectangle(width / 2, this.floorY + 20, width, 40, 0x111111).setOrigin(0.5);
        this.physics.add.existing(this.floor, true); // True = Static

        // 3. THE PLAYER (Chassis)
        this.player = this.add.rectangle(100, this.floorY - 20, 32, 32, 0xE056FD);
        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(1600);
        body.setCollideWorldBounds(true);

        // 4. COLLISION LOGIC (Player hits Floor)
        this.physics.add.collider(this.player, this.floor, () => {
            this.jumpCount = 0; // Reset jumps on landing
            this.tweens.killTweensOf(this.player);
            this.player.angle = 0; // Reset rotation
        });

        this.obstacles = this.physics.add.group();

        // 5. SPAWN LOOP
        this.time.addEvent({
            delay: 1500, // Spawn rate
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // Controls
        this.input.on('pointerdown', () => this.jump());
        this.input.keyboard?.on('keydown-SPACE', () => this.jump());

        this.physics.add.overlap(this.player, this.obstacles, () => this.gameOver());
    }

    private jump() {
        if (this.isDead) return;

        // DOUBLE JUMP LOGIC
        if (this.jumpCount < 2) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            body.setVelocityY(-650); // Jump Force
            this.jumpCount++;
            this.audio.playJump();

            // Visual Feedback
            this.tweens.add({
                targets: this.player,
                angle: this.player.angle + 90,
                duration: 200
            });
        }
    }

    private spawnObstacle() {
        if (this.isDead) return;
        const { width } = this.scale;

        // 6. ENEMY SPAWN (Locked to Floor Y)
        // Enemies now spawn exactly on the floor line
        const obs = this.add.rectangle(width + 50, this.floorY - 20, 40, 40, 0xFF003C);
        this.obstacles.add(obs);

        const body = obs.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(-this.gameSpeed);
        body.setAllowGravity(false); // Enemies glide, they don't fall
        body.setImmovable(true);
    }

    update() {
        if (this.isDead) return;
        this.score += 1;
        this.gameSpeed = 400 + Math.floor(this.score / 200) * 20; // Scale speed

        // Clean up off-screen enemies
        this.obstacles.getChildren().forEach((child: any) => {
            if (child.x < -50) {
                child.destroy();
                this.audio.playScore();
            }
        });

        this.callbacks.onScore(this.score);
    }

    private gameOver() {
        this.isDead = true;
        this.physics.pause();
        this.audio.playCrash();
        this.cameras.main.shake(400, 0.03);
        this.callbacks.onDeath(this.score);
    }

    restart() {
        this.score = 0;
        this.gameSpeed = 400;
        this.isDead = false;
        this.scene.restart();
    }
}