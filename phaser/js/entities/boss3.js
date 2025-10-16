// entities/bossFinal.js
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class BossFinal extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss_final");

    // --- VIE ---
    this.maxVie = 15;
    this.vie = this.maxVie;

    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;

    this.state = "idle"; 
    this.phase = 1;
    this.combatStarted = false;

    this.spots = [
      { x: 1000, y: 500 },
      { x: 1200, y: 500 },
      { x: 1400, y: 500 }
    ];

    this.lastAction = 0;
    this.actionCooldown = 2500;

    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    // --- BARRE DE VIE ---
    this.lifeBar = scene.add.graphics();
    this.lifeBar.setDepth(10);
    this.updateLifeBar();

    this.play("boss_final_idle_right");
  }

  updateLifeBar() {
    if (!this.lifeBar) return;
    const barWidth = 100;
    const barHeight = 10;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height - 30;

    this.lifeBar.clear();
    this.lifeBar.fillStyle(0x333333, 1);
    this.lifeBar.fillRect(x, y, barWidth, barHeight);

    const percent = Math.max(this.vie / this.maxVie, 0);
    const color = percent > 0.5 ? 0x06c80f : (percent > 0.2 ? 0xf8c200 : 0xdb222a);
    this.lifeBar.fillStyle(color, 1);
    this.lifeBar.fillRect(x, y, barWidth * percent, barHeight);
  }

  takeDamage(amount = 1) {
    this.vie = Math.max(0, this.vie - amount);
    this.updateLifeBar();
    if (this.vie <= 0) this.destroy();
  }

  update(player, projectilesGroup) {
    if (!this.body || !player || this.vie <= 0) return;

    this.projectilesGroup = projectilesGroup;
    this.alert.setPosition(this.x, this.y - this.height);
    this.updateLifeBar();

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (!this.combatStarted && distance < 400 && this.hasLineOfSightTo(player, this.scene.calque_plateformes)) {
      this.combatStarted = true;
      this.state = "active";
    }

    if (!this.combatStarted) {
      this.playIdle();
      return;
    }

    this.updatePhase();
    const now = this.scene.time.now;

    if (this.state === "alert") {
      this.playIdle();
      return;
    }

    if (now - this.lastAction >= this.actionCooldown) {
      this.lastAction = now;

      let actions = [];
      if (this.phase === 1) actions = ["teleport", "attackProjectiles"];
      else if (this.phase === 2) actions = ["teleport", "attackProjectiles", "attackJumpSmash"];
      else actions = ["teleport", "attackProjectiles", "attackJumpSmash", "attackFireRain"];

      const choice = Phaser.Utils.Array.GetRandom(actions);

      if ((choice === "attackProjectiles" || choice === "attackJumpSmash" || choice === "attackFireRain") &&
          !this.hasLineOfSightTo(player, this.scene.calque_plateformes)) {
        this.state = "idle";
        return;
      }

      if (choice === "teleport") this.preAction(() => this.teleportToNextSpot());
      else if (choice === "attackProjectiles") this.preAction(() => this.attackProjectiles(player));
      else if (choice === "attackJumpSmash") this.preAction(() => this.attackJumpSmash(player));
      else if (choice === "attackFireRain") this.preAction(() => this.attackFireRain(player));
    }

    if (this.state === "idle" || this.state === "alert") this.playIdle();
    else if (this.state === "attack") this.playAttack();
  }

  playIdle() {
    if (this.direction === 1) this.anims.play("boss_final_idle_right", true);
    else this.anims.play("boss_final_idle_left", true);
    this.state = "idle";
  }

  playAttack() {
    if (this.direction === 1) this.anims.play("boss_final_attack_right", true);
    else this.anims.play("boss_final_attack_left", true);
  }

  updatePhase() {
    const hpPercent = this.vie / this.maxVie;
    if (hpPercent > 0.7) this.phase = 1;
    else if (hpPercent > 0.4) this.phase = 2;
    else this.phase = 3;
  }

  preAction(callback) {
    if (this.state === "alert") return;
    this.state = "alert";
    this.alert.setVisible(true);

    this.scene.time.delayedCall(600, () => {
      if (!this.body) return;
      this.alert.setVisible(false);
      this.state = "active";
      callback();
    });
  }

  teleportToNextSpot() {
    const currentIndex = this.spots.findIndex(s => s.x === this.x && s.y === this.y);
    let nextIndex;
    do { nextIndex = Phaser.Math.Between(0, this.spots.length - 1); } 
    while (nextIndex === currentIndex);

    const nextSpot = this.spots[nextIndex];
    this.setPosition(nextSpot.x, nextSpot.y);

    const puff = this.scene.add.particles(this.x, this.y, "img_boss_final", {
      speed: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 8
    });
    this.scene.time.delayedCall(400, () => puff.destroy());
    this.scene.tweens.add({ targets: this, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  attackProjectiles(player) {
    if (!player) return;
    this.state = "attack";

    const projectile = this.scene.physics.add.sprite(this.x, this.y, "dark_projectile");
    this.projectilesGroup.add(projectile);
    projectile.body.setAllowGravity(false);
    projectile.setCollideWorldBounds(false);

    const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, player.x, player.y);
    const speed = this.phase === 3 ? 300 : 220;

    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    projectile.setRotation(angle);

    this.scene.physics.add.overlap(projectile, player, () => {
      if (!projectile.active) return;
      projectile.destroy();
      fct.lifeManager.retirerPV(this.scene, 1);
    });

    this.scene.time.delayedCall(500, () => this.state = "idle");
    this.scene.time.delayedCall(5000, () => { if (projectile.active) projectile.destroy(); });
  }

  attackJumpSmash(player) {
    this.state = "attack";
    // Implémente ici l'attaque "saut + smash" comme dans ton ancien code
    this.scene.time.delayedCall(800, () => this.state = "idle");
  }

  attackFireRain(player) {
    this.state = "attack";
    // Implémente ici l'attaque "pluie de projectiles" comme dans ton ancien code
    this.scene.time.delayedCall(1000, () => this.state = "idle");
  }

  destroy(fromScene) {
    if (this.activeTimers) this.activeTimers.forEach(t => t.remove(false));
    if (this.alert) this.alert.destroy();
    if (this.lifeBar) {
      this.lifeBar.destroy();
      this.lifeBar = null;
    }
    super.destroy(fromScene);
  }
}
