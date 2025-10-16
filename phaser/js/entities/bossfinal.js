// === entities/bossfinal.js ===
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class BossFinal extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_bossFinal");

    // === STATS ===
    this.vieMax = 12;
    this.vie = this.vieMax;
    this.phase = 1;

    // === PHYSIQUE ===
    this.setGravityY(400);
    this.setCollideWorldBounds(true);
    this.direction = -1;
    this.state = "idle";

    // === ATTAQUES ===
    this.attackCooldown = 3000;
    this.lastAttack = 0;
    this.damage = 1;
    this.isAttacking = false;

    // === GROUPES ===
    this.projectilesGroup = scene.physics.add.group();

    // === FLAGS ===
    this.hasDroppedItem = false;

    // === ALERTES ===
    this.alert = scene.add.text(this.x, this.y - this.height, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    // === TIMERS ACTIFS ===
    this.activeTimers = [];
  }

  safeCall(callback) {
    if (!this.scene || !this.body || !this.active) return false;
    callback();
    return true;
  }

  update(platformLayer, player) {
    if (!this.safeCall(() => {}) || !player || this.isAttacking) return;

    // === Phase management ===
    if (this.vie <= this.vieMax / 2 && this.phase === 1) {
      this.phase = 2;
      this.attackCooldown = 2000;
    }

    // === Orientation ===
    this.direction = player.x > this.x ? 1 : -1;
    if (this.alert) this.alert.setPosition(this.x, this.y - this.height);

    // === Attaque aléatoire ===
    const now = this.scene.time.now;
    if (now - this.lastAttack > this.attackCooldown) {
      this.showAlert(() => this.chooseAttack(player));
      this.lastAttack = now;
    } else {
      this.playIdle();
    }
  }

  showAlert(callback) {
    this.safeCall(() => {
      if (this.alert) this.alert.setVisible(true);
      const timer = this.scene.time.delayedCall(500, () => {
        if (this.alert) this.alert.setVisible(false);
        callback();
      });
      this.activeTimers.push(timer);
    });
  }

  chooseAttack(player) {
    if (!this.safeCall(() => {})) return;
    this.isAttacking = true;

    const attacksPhase1 = ["projectiles", "jumpSmash", "teleport", "fireRain"];
    const attacksPhase2 = ["projectilesUp", "jumpSmash", "teleport", "fireRain"];

    const list = this.phase === 1 ? attacksPhase1 : attacksPhase2;
    const attack = Phaser.Utils.Array.GetRandom(list);

    switch (attack) {
      case "projectiles": this.attackProjectiles(player); break;
      case "projectilesUp": this.attackProjectilesFromAbove(player); break;
      case "jumpSmash": this.attackJumpSmash(); break;
      case "teleport": this.attackTeleport(player); break;
      case "fireRain": this.attackFireRain(); break;
    }
  }

  playIdle() {
    this.safeCall(() => {
      this.state = "idle";
      this.anims?.play(this.direction === 1 ? "bossfinal_idle_right" : "bossfinal_idle_left", true);
    });
  }

  playAttack() {
    this.safeCall(() => {
      this.state = "attack";
      this.anims?.play(this.direction === 1 ? "bossfinal_attack_right" : "bossfinal_attack_left", true);
    });
  }

  attackProjectiles(player) {
    if (!this.safeCall(() => {})) return;
    this.playAttack();
    const nbShots = 3;
    const delay = 800;

    for (let i = 0; i < nbShots; i++) {
      const timer = this.scene.time.delayedCall(i * delay, () => {
        if (!this.active) return;
        this.shootProjectile(player);
        if (i === nbShots - 1) this.endAttack();
      });
      this.activeTimers.push(timer);
    }
  }

  attackProjectilesFromAbove(player) {
    if (!this.safeCall(() => {})) return;
    this.playAttack();
    const targetY = this.y - 500;
    const originalY = this.y;

    this.body.setAllowGravity(false);
    this.setY(targetY);

    const nbShots = 3;
    const delay = 1000;

    for (let i = 0; i < nbShots; i++) {
      const timer = this.scene.time.delayedCall(i * delay, () => {
        if (!this.active) return;
        this.shootProjectile(player);
        if (i === nbShots - 1) {
          const timer2 = this.scene.time.delayedCall(1000, () => {
            if (!this.active) return;
            this.body.setAllowGravity(true);
            this.setY(originalY);
            this.endAttack();
          });
          this.activeTimers.push(timer2);
        }
      });
      this.activeTimers.push(timer);
    }
  }

  attackJumpSmash() {
    if (!this.safeCall(() => {})) return;
    this.playAttack();
    this.setVelocityY(-400);
    const timer = this.scene.time.delayedCall(1000, () => {
      if (!this.active) return;
      this.createShockwave();
      this.endAttack();
    });
    this.activeTimers.push(timer);
  }

  createShockwave() {
    if (!this.safeCall(() => {})) return;
    const range = 100;
    const player = this.scene.player;
    if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < range) {
      fct.lifeManager.retirerPV(this.scene, 1);
      player.setTint(0xff0000);
      const timer = this.scene.time.delayedCall(300, () => player.clearTint());
      this.activeTimers.push(timer);
    }
  }

  attackTeleport(player) {
    if (!this.safeCall(() => {}) || !this.scene.map4) return;
    const minDistance = 300;
    const randomOffset = Phaser.Math.Between(minDistance, 500) * (Math.random() < 0.5 ? -1 : 1);
    const newX = Phaser.Math.Clamp(player.x + randomOffset, 100, this.scene.map4.widthInPixels - 100);
    this.setX(newX);

    const timer = this.scene.time.delayedCall(500, () => this.endAttack());
    this.activeTimers.push(timer);
  }

  attackFireRain() {
    if (!this.safeCall(() => {}) || !this.scene.map4) return;
    const nb = this.phase === 1 ? 3 : 6;
    const delay = 800;

    for (let i = 0; i < nb; i++) {
      const timer = this.scene.time.delayedCall(i * delay, () => {
        if (!this.active) return;
        this.spawnFallingFire();
        if (i === nb - 1) this.endAttack();
      });
      this.activeTimers.push(timer);
    }
  }

  spawnFallingFire() {
    if (!this.safeCall(() => {}) || !this.scene.map4) return;
    const x = Phaser.Math.Between(100, this.scene.map4.widthInPixels - 100);
    const projectile = this.projectilesGroup.create(x, this.y - 500, "bossfinal_projectile");
    projectile.body.setAllowGravity(true);
    projectile.setVelocityY(300);
    projectile.damage = this.damage;
    projectile.setRotation(Math.PI / 2);
  }

  shootProjectile(player) {
    if (!this.safeCall(() => {})) return;
    const projectile = this.projectilesGroup.create(this.x, this.y - 20, "bossfinal_projectile");
    projectile.body.setAllowGravity(false);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const angle = Math.atan2(dy, dx);
    const speed = 300;

    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    projectile.setRotation(angle);
    projectile.damage = this.damage;

    const timer = this.scene.time.delayedCall(4000, () => {
      if (projectile.active) projectile.destroy();
    });
    this.activeTimers.push(timer);
  }

  endAttack() {
    if (!this.active) return;
    this.isAttacking = false;
    this.playIdle();
  }

  takeDamage(amount = 1) {
    if (!this.active) return;
    this.vie -= amount;
    this.setTint(0xff6666);
    if (this.scene) {
        const timer = this.scene.time.delayedCall(200, () => this.clearTint());
        this.activeTimers.push(timer);
        if (this.scene.bossHealthBar) {
        // actualise la barre de vie ici (si tu utilises une barre dynamique)
        }
        if (this.vie <= 0) {
        this.destroy();
        }
    }
  }

  destroy(fromScene) {
  if (!this.active) return;
  this.active = false;
  this.activeTimers.forEach(t => t.remove());
  this.activeTimers = [];
  this.projectilesGroup?.clear(true, true);
  this.alert?.destroy();

  if (this.bossMusic?.isPlaying) this.bossMusic.stop();

  if (this.scene) {
    this.scene.tweens.add({
      targets: [this.scene.bossHealthBar, this.scene.bossHealthBarBg, this.scene.bossNameText],
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        if (this.scene.porte_retour_boss) {
          this.scene.porte_retour_boss.setVisible(true);
          this.scene.porte_retour_boss.body.enable = true;
        }
        super.destroy(fromScene);
      }
    });
  } else {
    super.destroy(fromScene);
  }
}



}
