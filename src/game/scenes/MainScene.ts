import Phaser from 'phaser';
import { AudioEngine } from '../systems/AudioEngine';
import { DifficultyConfig, DIFFICULTIES, Callbacks, ActivePowerUpInfo, PowerUpType } from '../config';

export default class MainScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private floor!: Phaser.GameObjects.Rectangle;
    private audio!: AudioEngine;
    private callbacks: Callbacks;
    
    // ===== DIFFICULTY & START MENU FEATURE START =====
    private difficulty: DifficultyConfig;
    private gameSpeed: number = 400;
    // ===== DIFFICULTY & START MENU FEATURE END =====

    // ===== PARTICLE SYSTEM FEATURE START =====
    private jumpEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private doubleJumpEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private crashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private runEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    // ===== PARTICLE SYSTEM FEATURE END =====

    // ===== POWER-UP SYSTEM FEATURE START =====
    private powerups!: Phaser.Physics.Arcade.Group;
    private hasShield: boolean = false;
    private shieldVisual!: Phaser.GameObjects.Arc;
    private boostTimeRemaining: number = 0;
    private isInvulnerable: boolean = false;
    private powerUpTimer?: Phaser.Time.TimerEvent;
    private lastHudUpdate: number = 0;
    // ===== POWER-UP SYSTEM FEATURE END =====

    private score: number = 0;
    private isDead: boolean = false;
    private jumpCount: number = 0; // State Machine for Double Jump
    private floorY: number = 0;

    constructor(cb: Callbacks, initialDifficulty: DifficultyConfig = DIFFICULTIES.MEDIUM) {
        super('MainScene');
        this.callbacks = cb;
        this.difficulty = initialDifficulty;
    }

    // ===== DIFFICULTY & START MENU FEATURE START =====
    init(data?: { difficulty?: DifficultyConfig }) {
        if (data?.difficulty) {
            this.difficulty = data.difficulty;
        }
    }

    public setDifficulty(difficulty: DifficultyConfig) {
        this.difficulty = difficulty;
    }
    // ===== DIFFICULTY & START MENU FEATURE END =====

    // ===== PARTICLE SYSTEM FEATURE START =====
    private createParticleTextures() {
        if (!this.textures.exists('violet_spark')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xE056FD, 1);
            g.fillRect(0, 0, 6, 6);
            g.generateTexture('violet_spark', 6, 6);
            g.destroy();
        }
        if (!this.textures.exists('cyan_spark')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x00F3FF, 1);
            g.fillRect(0, 0, 5, 5);
            g.generateTexture('cyan_spark', 5, 5);
            g.destroy();
        }
        if (!this.textures.exists('red_spark')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xFF003C, 1);
            g.fillRect(0, 0, 8, 8);
            g.generateTexture('red_spark', 8, 8);
            g.destroy();
        }
        if (!this.textures.exists('gold_spark')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xFFE600, 1);
            g.fillRect(0, 0, 6, 6);
            g.generateTexture('gold_spark', 6, 6);
            g.destroy();
        }
    }

    private setupParticleEmitters() {
        this.createParticleTextures();

        // 1. Jump Spark Emitter (Neon Violet Downward Burst)
        this.jumpEmitter = this.add.particles(0, 0, 'violet_spark', {
            speed: { min: 100, max: 280 },
            angle: { min: 45, max: 135 }, // Downward kinetic spray
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 350,
            gravityY: 300,
            blendMode: 'ADD',
            emitting: false
        });

        // 2. Double Jump Radial Shockwave Emitter (Cyber Cyan)
        this.doubleJumpEmitter = this.add.particles(0, 0, 'cyan_spark', {
            speed: { min: 140, max: 340 },
            angle: { min: 0, max: 360 }, // 360 ring burst
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false
        });

        // 3. Crash Impact Explosion Emitter (Cyber Red Shockwave)
        this.crashEmitter = this.add.particles(0, 0, 'red_spark', {
            speed: { min: 150, max: 520 },
            angle: { min: 0, max: 360 }, // Full radial blast
            scale: { start: 2.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 700,
            gravityY: 250,
            blendMode: 'ADD',
            emitting: false
        });

        // 4. Ground Friction Runner Trail
        this.runEmitter = this.add.particles(0, 0, 'cyan_spark', {
            speed: { min: 30, max: 120 },
            angle: { min: 150, max: 210 }, // Backward friction trail
            scale: { start: 0.9, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 220,
            blendMode: 'ADD',
            emitting: false
        });
    }
    // ===== PARTICLE SYSTEM FEATURE END =====

    // ===== POWER-UP SYSTEM FEATURE START =====
    private createPowerUpTextures() {
        // 1. Procedural SHIELD Pickup Texture (Neon Cyan Diamond with Core)
        if (!this.textures.exists('powerup_shield')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            
            // Outer Diamond
            g.fillStyle(0x00F3FF, 1);
            g.beginPath();
            g.moveTo(16, 2);
            g.lineTo(30, 16);
            g.lineTo(16, 30);
            g.lineTo(2, 16);
            g.closePath();
            g.fillPath();

            // Inner Contrast Core
            g.fillStyle(0x050505, 1);
            g.fillCircle(16, 16, 8);

            // Glowing Center Emblem
            g.fillStyle(0x00F3FF, 1);
            g.fillCircle(16, 16, 4);

            g.generateTexture('powerup_shield', 32, 32);
            g.destroy();
        }

        // 2. Procedural SPEED BOOST Pickup Texture (Cyber Gold Double Chevrons)
        if (!this.textures.exists('powerup_boost')) {
            const g = this.make.graphics({ x: 0, y: 0 });

            // Outer Hexagon
            g.fillStyle(0xFFE600, 1);
            g.beginPath();
            g.moveTo(8, 2);
            g.lineTo(24, 2);
            g.lineTo(30, 16);
            g.lineTo(24, 30);
            g.lineTo(8, 30);
            g.lineTo(2, 16);
            g.closePath();
            g.fillPath();

            // Inner Contrast Core
            g.fillStyle(0x050505, 1);
            g.fillCircle(16, 16, 9);

            // Double Right Chevrons >>
            g.fillStyle(0xFFE600, 1);
            g.beginPath();
            g.moveTo(10, 8);
            g.lineTo(16, 16);
            g.lineTo(10, 24);
            g.lineTo(13, 24);
            g.lineTo(19, 16);
            g.lineTo(13, 8);
            g.closePath();
            g.fillPath();

            g.beginPath();
            g.moveTo(17, 8);
            g.lineTo(23, 16);
            g.lineTo(17, 24);
            g.lineTo(20, 24);
            g.lineTo(26, 16);
            g.lineTo(20, 8);
            g.closePath();
            g.fillPath();

            g.generateTexture('powerup_boost', 32, 32);
            g.destroy();
        }
    }
    // ===== POWER-UP SYSTEM FEATURE END =====

    create() {
        this.physics.resume();
        this.isDead = false;
        this.jumpCount = 0;
        this.score = 0;

        // ===== DIFFICULTY & START MENU FEATURE START =====
        this.gameSpeed = this.difficulty.baseSpeed;
        // ===== DIFFICULTY & START MENU FEATURE END =====

        // ===== POWER-UP SYSTEM FEATURE START =====
        this.hasShield = false;
        this.boostTimeRemaining = 0;
        this.isInvulnerable = false;
        this.lastHudUpdate = 0;
        // ===== POWER-UP SYSTEM FEATURE END =====

        this.audio = new AudioEngine();
        const { width, height } = this.scale;

        // ===== PARTICLE SYSTEM FEATURE START =====
        this.setupParticleEmitters();
        // ===== PARTICLE SYSTEM FEATURE END =====

        // ===== POWER-UP SYSTEM FEATURE START =====
        this.createPowerUpTextures();
        // ===== POWER-UP SYSTEM FEATURE END =====

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

        // ===== DIFFICULTY & START MENU FEATURE START =====
        body.setGravityY(this.difficulty.gravity);
        // ===== DIFFICULTY & START MENU FEATURE END =====

        body.setCollideWorldBounds(true);

        // ===== POWER-UP SYSTEM FEATURE START =====
        // Rotating Energy Shield Visual
        this.shieldVisual = this.add.circle(100, this.floorY - 20, 26, 0x00F3FF, 0.22);
        this.shieldVisual.setStrokeStyle(3, 0x00F3FF, 0.85);
        this.shieldVisual.setVisible(false);
        this.shieldVisual.setDepth(20);
        // ===== POWER-UP SYSTEM FEATURE END =====

        // 4. COLLISION LOGIC (Player hits Floor)
        this.physics.add.collider(this.player, this.floor, () => {
            this.jumpCount = 0; // Reset jumps on landing
            this.tweens.killTweensOf(this.player);
            this.player.angle = 0; // Reset rotation
        });

        this.obstacles = this.physics.add.group();

        // 5. SPAWN LOOP
        // ===== DIFFICULTY & START MENU FEATURE START =====
        this.time.addEvent({
            delay: this.difficulty.spawnDelay, // Spawn rate scaled by difficulty
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
        // ===== DIFFICULTY & START MENU FEATURE END =====

        // ===== POWER-UP SYSTEM FEATURE START =====
        // Power-Up Group & Spawning Timer
        this.powerups = this.physics.add.group();
        this.powerUpTimer = this.time.addEvent({
            delay: 10000, // Spawns every 10 seconds
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });

        // Player & Power-Up Overlap
        this.physics.add.overlap(this.player, this.powerups, (_player, powerUpObj) => {
            const item = powerUpObj as Phaser.GameObjects.Image;
            const type = item.getData('type') as PowerUpType;
            this.collectPowerUp(type, item.x, item.y);
            item.destroy();
        });

        // Player & Obstacle Collision with Shield / Boost logic
        this.physics.add.overlap(this.player, this.obstacles, (_player, obsObj) => {
            const obs = obsObj as Phaser.GameObjects.Rectangle;
            this.handleObstacleCollision(obs);
        });
        // ===== POWER-UP SYSTEM FEATURE END =====

        // Controls
        this.input.on('pointerdown', () => this.jump());
        this.input.keyboard?.on('keydown-SPACE', () => this.jump());
    }

    private jump() {
        if (this.isDead) return;

        // DOUBLE JUMP LOGIC
        if (this.jumpCount < 2) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;

            // ===== DIFFICULTY & START MENU FEATURE START =====
            body.setVelocityY(this.difficulty.jumpForce); // Jump Force tuned per difficulty physics
            // ===== DIFFICULTY & START MENU FEATURE END =====

            this.jumpCount++;
            this.audio.playJump();

            // ===== PARTICLE SYSTEM FEATURE START =====
            // Trigger particle burst on jump and double jump
            const px = this.player.x;
            const py = this.player.y + 14;

            if (this.jumpCount === 1) {
                // Initial jump: Violet downward sparks
                this.jumpEmitter.explode(18, px, py);
            } else if (this.jumpCount === 2) {
                // Double jump: Intense cyan radial burst & extra sparks
                this.doubleJumpEmitter.explode(24, px, py - 6);
                this.jumpEmitter.explode(12, px, py);
            }
            // ===== PARTICLE SYSTEM FEATURE END =====

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

        // ===== DIFFICULTY & START MENU FEATURE START =====
        // 6. ENEMY SPAWN WITH DIFFICULTY VARIATION
        let obsHeight = 40;
        let obsWidth = 40;
        const isHard = this.difficulty.name === 'HARD';
        
        if (isHard && Math.random() > 0.6) {
            obsHeight = 54; // Taller hazard on HARD mode
        }

        const obs = this.add.rectangle(width + 50, this.floorY - (obsHeight / 2), obsWidth, obsHeight, 0xFF003C);
        this.obstacles.add(obs);

        const body = obs.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(-this.gameSpeed);
        body.setAllowGravity(false); // Enemies glide, they don't fall
        body.setImmovable(true);

        // On HARD, chance to spawn a secondary close follow-up obstacle
        if (isHard && Math.random() > 0.7) {
            this.time.delayedCall(220, () => {
                if (this.isDead) return;
                const obs2 = this.add.rectangle(width + 50, this.floorY - 20, 36, 40, 0xFF003C);
                this.obstacles.add(obs2);
                const body2 = obs2.body as Phaser.Physics.Arcade.Body;
                body2.setVelocityX(-this.gameSpeed);
                body2.setAllowGravity(false);
                body2.setImmovable(true);
            });
        }
        // ===== DIFFICULTY & START MENU FEATURE END =====
    }

    // ===== POWER-UP SYSTEM FEATURE START =====
    private spawnPowerUp() {
        if (this.isDead) return;
        const { width } = this.scale;

        // Balance spawn: if already shielded, spawn SPEED_BOOST; else 50/50
        const type: PowerUpType = (this.hasShield || Math.random() > 0.5) ? 'SPEED_BOOST' : 'SHIELD';
        const textureKey = type === 'SHIELD' ? 'powerup_shield' : 'powerup_boost';

        // Choose elevation: 40% near floor, 60% mid-air (jump path)
        const spawnY = Math.random() > 0.4 ? this.floorY - 90 : this.floorY - 25;

        const item = this.add.image(width + 50, spawnY, textureKey);
        this.powerups.add(item);

        const body = item.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(-this.gameSpeed * 0.95);
        body.setAllowGravity(false);
        body.setImmovable(true);

        item.setData('type', type);

        // Bobbing vertical hover tween
        this.tweens.add({
            targets: item,
            y: spawnY - 10,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Slow rotating hover spin
        this.tweens.add({
            targets: item,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    private collectPowerUp(type: PowerUpType, x: number, y: number) {
        if (this.isDead) return;

        this.audio.playPowerUp();

        // Neon floating text banner
        const textLabel = type === 'SHIELD' ? '+SHIELD MATRIX' : '+OVERDRIVE BOOST';
        const textColor = type === 'SHIELD' ? '#00F3FF' : '#FFE600';
        const feedback = this.add.text(this.player.x, this.player.y - 35, textLabel, {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            fontStyle: 'bold',
            color: textColor,
            backgroundColor: '#000000E0',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: feedback,
            y: feedback.y - 25,
            alpha: 0,
            duration: 850,
            onComplete: () => feedback.destroy()
        });

        if (type === 'SHIELD') {
            this.hasShield = true;
            this.shieldVisual.setVisible(true);
            this.shieldVisual.setScale(1.5);
            this.shieldVisual.setAlpha(1);

            this.tweens.add({
                targets: this.shieldVisual,
                scale: 1,
                duration: 250,
                ease: 'Back.easeOut'
            });

            this.doubleJumpEmitter.explode(22, x, y);

            this.callbacks.onPowerUpChange?.({
                type: 'SHIELD',
                label: 'SHIELD MATRIX ACTIVE',
                color: '#00F3FF',
                durationMs: 1,
                timeRemainingMs: 1
            });
        } else {
            // SPEED_BOOST / OVERDRIVE (6 seconds of invincibility + double score accumulation)
            this.boostTimeRemaining = 6000;
            this.audio.playBoost();
            this.doubleJumpEmitter.explode(30, x, y);

            this.cameras.main.flash(200, 255, 230, 0, false);

            this.callbacks.onPowerUpChange?.({
                type: 'SPEED_BOOST',
                label: 'OVERDRIVE ACTIVE',
                color: '#FFE600',
                durationMs: 6000,
                timeRemainingMs: 6000
            });
        }
    }

    private handleObstacleCollision(obs: Phaser.GameObjects.Rectangle) {
        if (this.isDead || this.isInvulnerable) return;

        // 1. OVERDRIVE BOOST: Vaporize obstacles on contact
        if (this.boostTimeRemaining > 0) {
            obs.destroy();
            this.crashEmitter.explode(30, obs.x, obs.y);
            this.audio.playCrash();
            this.cameras.main.shake(120, 0.015);
            this.score += 50; // Bonus points for crushing hazards
            return;
        }

        // 2. SHIELD: Absorb collision, shatter shield, and grant invulnerability frames
        if (this.hasShield) {
            this.hasShield = false;
            this.shieldVisual.setVisible(false);
            obs.destroy();

            this.audio.playShieldBreak();
            this.crashEmitter.explode(35, obs.x, obs.y);
            this.doubleJumpEmitter.explode(25, this.player.x, this.player.y);
            this.cameras.main.shake(250, 0.02);

            // 800ms invulnerability buffer
            this.isInvulnerable = true;
            this.tweens.add({
                targets: this.player,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.player.setAlpha(1);
                    this.isInvulnerable = false;
                }
            });

            this.callbacks.onPowerUpChange?.(null);
            return;
        }

        // 3. Unshielded lethal impact
        this.gameOver();
    }
    // ===== POWER-UP SYSTEM FEATURE END =====

    update(time: number, delta: number) {
        if (this.isDead) return;

        // ===== POWER-UP SYSTEM FEATURE START =====
        // Boost timer decrement and active powerup status updates
        if (this.boostTimeRemaining > 0) {
            this.boostTimeRemaining -= delta;
            this.score += 2; // Accelerated score progression during Overdrive
            this.runEmitter.emitParticleAt(this.player.x - 14, this.player.y + 14, 2);

            if (this.boostTimeRemaining <= 0) {
                this.boostTimeRemaining = 0;
                if (this.hasShield) {
                    this.callbacks.onPowerUpChange?.({
                        type: 'SHIELD',
                        label: 'SHIELD MATRIX ACTIVE',
                        color: '#00F3FF',
                        durationMs: 1,
                        timeRemainingMs: 1
                    });
                } else {
                    this.callbacks.onPowerUpChange?.(null);
                }
            } else if (time - this.lastHudUpdate > 80) {
                this.lastHudUpdate = time;
                this.callbacks.onPowerUpChange?.({
                    type: 'SPEED_BOOST',
                    label: 'OVERDRIVE ACTIVE',
                    color: '#FFE600',
                    durationMs: 6000,
                    timeRemainingMs: Math.max(0, this.boostTimeRemaining)
                });
            }
        } else {
            this.score += 1;
        }

        // Sync shield visual aura position to player
        if (this.hasShield && this.shieldVisual) {
            this.shieldVisual.setPosition(this.player.x, this.player.y);
        }
        // ===== POWER-UP SYSTEM FEATURE END =====

        // ===== DIFFICULTY & START MENU FEATURE START =====
        const activeSpeedBonus = this.boostTimeRemaining > 0 ? 140 : 0;
        this.gameSpeed = this.difficulty.baseSpeed + activeSpeedBonus + Math.floor(this.score / 200) * this.difficulty.speedScaleFactor;
        // ===== DIFFICULTY & START MENU FEATURE END =====

        // ===== PARTICLE SYSTEM FEATURE START =====
        // Emit ground friction sparks when running on floor
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body && body.blocked.down) {
            this.runEmitter.emitParticleAt(this.player.x - 14, this.player.y + 14, 1);
        }
        // ===== PARTICLE SYSTEM FEATURE END =====

        // Clean up off-screen enemies
        [...this.obstacles.getChildren()].forEach((child: any) => {
            if (child.x < -50) {
                child.destroy();
                this.audio.playScore();
            }
        });

        // ===== POWER-UP SYSTEM FEATURE START =====
        // Clean up off-screen powerups
        [...this.powerups.getChildren()].forEach((child: any) => {
            if (child.x < -60) {
                child.destroy();
            }
        });
        // ===== POWER-UP SYSTEM FEATURE END =====

        this.callbacks.onScore(this.score);
    }

    private gameOver() {
        this.isDead = true;

        // ===== PARTICLE SYSTEM FEATURE START =====
        // Trigger high-octane Cyber-Red crash impact explosion at collision point
        if (this.player) {
            this.crashEmitter.explode(45, this.player.x, this.player.y);
            this.player.setVisible(false); // Hide chassis on destruction
        }
        // ===== PARTICLE SYSTEM FEATURE END =====

        // ===== POWER-UP SYSTEM FEATURE START =====
        this.hasShield = false;
        this.boostTimeRemaining = 0;
        this.shieldVisual?.setVisible(false);
        this.callbacks.onPowerUpChange?.(null);
        // ===== POWER-UP SYSTEM FEATURE END =====

        this.physics.pause();
        this.audio.playCrash();
        this.cameras.main.shake(400, 0.03);
        this.callbacks.onDeath(this.score);
    }

    // ===== DIFFICULTY & START MENU FEATURE START =====
    restart(newDifficulty?: DifficultyConfig) {
        if (newDifficulty) {
            this.difficulty = newDifficulty;
        }
        this.score = 0;
        this.gameSpeed = this.difficulty.baseSpeed;
        this.isDead = false;
        this.jumpCount = 0;

        // ===== POWER-UP SYSTEM FEATURE START =====
        this.hasShield = false;
        this.boostTimeRemaining = 0;
        this.isInvulnerable = false;
        this.shieldVisual?.setVisible(false);
        this.callbacks.onPowerUpChange?.(null);
        // ===== POWER-UP SYSTEM FEATURE END =====

        this.physics.resume();
        this.scene.restart({ difficulty: this.difficulty });
    }
    // ===== DIFFICULTY & START MENU FEATURE END =====
}