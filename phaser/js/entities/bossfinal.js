// entities/bossfinal.js
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class BossFinal extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_bossFinal");

    this.vieMax = 12;
    this.vie = this.vieMax;

    this.setGravityY(400);
    this.setCollideWorldBounds(true);
    this.direction = -1;
    this.state = "idle";

    this.attackCooldown = 2000;
    this.lastAttack = 0;
    this.damage = 1;

    this.hasDroppedItem = false;

    // Groupe pour les projectiles du boss
    this.projectilesGroup = scene.physics.add.group();
  }

  update(platformLayer, player) {
    if (!this.body || !player) return;

    const now = this.scene.time.now;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Se tourne vers le joueur
    this.direction = player.x > this.x ? 1 : -1;

    // Attaque à distance toutes les X secondes
    if (now - this.lastAttack > this.attackCooldown) {
      this.attack(player);
      this.lastAttack = now;
    }

    // Animation
    if (this.state === "idle") this.playIdle();
    else if (this.state === "attack") this.playAttack();
  }

  playIdle() {
    this.state = "idle";
    if (this.direction === 1)
      this.anims.play("bossfinal_idle_right", true);
    else
      this.anims.play("bossfinal_idle_left", true);
  }

  playAttack() {
    this.state = "attack";
    if (this.direction === 1)
      this.anims.play("bossfinal_attack_right", true);
    else
      this.anims.play("bossfinal_attack_left", true);
  }

  attack(player) {
    this.playAttack();

    this.scene.time.delayedCall(400, () => {
      if (!this.body || !player) return;
      this.shootProjectile(player);
      this.scene.time.delayedCall(500, () => this.state = "idle");
    });
  }

  shootProjectile(player) {
    const projectile = this.projectilesGroup.create(this.x, this.y - 20, "bossfinal_projectile");
    projectile.body.setAllowGravity(false);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const angle = Math.atan2(dy, dx);
    const speed = 300;

    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    projectile.setRotation(angle);
    projectile.damage = this.damage;

    // Taille & collisions
    projectile.setCollideWorldBounds(false);

    // Auto-destruction
    this.scene.time.delayedCall(4000, () => {
      if (projectile.active) projectile.destroy();
    });
  }

  takeDamage(amount = 1) {
    this.vie -= amount;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(200, () => this.clearTint());

    // === 🔥 Met à jour immédiatement la barre de vie ===
    if (this.scene.bossHealthBar) {
        const vieRatio = Phaser.Math.Clamp(this.vie / 12, 0, 1); // 12 = vie max du boss
        const bossBarWidth = 800; // même valeur que dans la scène
        this.scene.bossHealthBar.width = 800 * vieRatio;
    }

    if (this.vie <= 0) this.die();
  }


  die() {
    if (this.hasDroppedItem) return;
    this.hasDroppedItem = true;

    this.scene.cameras.main.shake(300, 0.01);

    // Arrêt musique boss
    if (this.bossMusic && this.bossMusic.isPlaying) {
      this.bossMusic.stop();
    }

    // Apparition porte de sortie
    if (this.scene.porte_retour_boss) {
      this.scene.porte_retour_boss.setVisible(true);
      this.scene.porte_retour_boss.body.enable = true;
    }

    // Supprime tous les projectiles restants
    this.projectilesGroup.clear(true, true);

    this.destroy();
  }
}
