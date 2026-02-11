import Phaser from 'phaser';
import { AudioEngine } from '../systems/AudioEngine';

export default class MainScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private audio!: AudioEngine;
    private gameSpeed: number = 400;
    private score: number = 0;
    private isDead: boolean = false;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() { super('MainScene'); }

    create() {
        this.audio = new AudioEngine();
        const { width, height } = this.scale;

        // Visual Grid
        this.add.grid(width/2, height/2, width, height, 40, 40, 0x000000, 0, 0xE056FD, 0.15);
        
        // Player Chassis
        this.player = this.add.rectangle(150, height/2, 32, 32, 0xE056FD);
        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setGravityY(1600);

        this.obstacles = this.physics.add.group();
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Spawning Loop
        this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // Jump Listener
        this.input.on('pointerdown', () => this.jump());
        this.input.keyboard?.on('keydown-SPACE', () => this.jump());

        this.physics.add.overlap(this.player, this.obstacles, () => this.gameOver());
    }

    private jump() {
        if (this.isDead) return;
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-600);
        this.audio.playJump();
        this.tweens.add({
            targets: this.player,
            angle: this.player.angle + 90,
            duration: 200
        });
    }

    private spawnObstacle() {
        if (this.isDead) return;
        const { width, height } = this.scale;
        const y = Phaser.Math.Between(100, height - 100);
        const obs = this.add.rectangle(width + 50, y, 40, 40, 0xFF003C);
        this.obstacles.add(obs);
        (obs.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.gameSpeed);
    }

    update() {
        if (this.isDead) return;

        this.score += 1;
        this.gameSpeed = 400 + Math.floor(this.score / 100) * 25;

        this.obstacles.getChildren().forEach((child: any) => {
            if (child.x < -50) {
                child.destroy();
                this.audio.playScore();
            }
        });

        // UPLINK_SIGNAL: Broadcast score to React
        this.events.emit('SCORE_UPDATE', this.score);
    }

    private gameOver() {
        this.isDead = true;
        this.physics.pause();
        this.audio.playCrash();
        this.cameras.main.shake(500, 0.03);
        this.events.emit('PLAYER_DIED', this.score);
    }

    restart() {
        this.score = 0;
        this.gameSpeed = 400;
        this.isDead = false;
        this.scene.restart();
    }
}