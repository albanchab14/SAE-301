// entities/boss2.js
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class Boss2 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss2", 0);

    this.vie = 5;
    this.setGravityY(300);
    this.setCollideWorldBounds(true);

    this.state = "idle"; // idle | shoot | dash | stunned
    this.detectionRange = 600;
    this.attackCooldown = 2000; // ms entre attaques
    this.lastAttack = 0;
    this.damage = 2;

    this.projectileSpeed = 250;
    this.projectileLife = 4000;

    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    this.hasDroppedCrystal = false;

    // Tableau pour stocker tous les timers actifs
    this.activeTimers = [];
  }

  update(platformLayer, player, projectilesGroup) {
    if (!this.body) return;
    this.alert.setPosition(this.x, this.y - this.height);

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const now = this.scene.time.now;

    if (distance < this.detectionRange && now - this.lastAttack > this.attackCooldown) {
      this.attack(player, projectilesGroup);
      this.lastAttack = now;
    }

    // animation idle par défaut
    if (this.state === "idle") {
      if (this.direction === 1)
        this.anims.play("boss2_idle_right", true);
      else this.anims.play("boss2_idle_left", true);
    }
  }

  attack(player, projectilesGroup) {
    if (!this.body) return;
    this.state = "shoot";
    this.alert.setVisible(true);

    const attackTimer = this.scene.time.delayedCall(600, () => {
      if (!this.body) return;
      this.alert.setVisible(false);

      const direction = player.x > this.x ? 1 : -1;
      this.direction = direction;

      // Crée le projectile et ajoute au groupe
      const projectile = this.scene.physics.add.sprite(this.x, this.y - 20, "fireball");
      projectilesGroup.add(projectile);
      projectile.body.setAllowGravity(false);
      projectile.body.setCollideWorldBounds(false);

      const dx = player.x - this.x;
      const dy = player.y - (this.y - 20);
      const angle = Math.atan2(dy, dx);

      const vx = Math.cos(angle) * this.projectileSpeed;
      const vy = Math.sin(angle) * this.projectileSpeed;
      projectile.setVelocity(vx, vy);

      // Auto-destruction du projectile
      const projTimer = this.scene.time.delayedCall(this.projectileLife, () => {
        if (projectile && projectile.active) projectile.destroy();
      });
      this.activeTimers.push(projTimer);

      // Animation attaque
      if (direction === 1) this.anims.play("boss2_attack_right", true);
      else this.anims.play("boss2_attack_left", true);

      // Retour à idle
      const idleTimer = this.scene.time.delayedCall(800, () => {
        if (this.body) this.state = "idle";
      });
      this.activeTimers.push(idleTimer);

    });
    this.activeTimers.push(attackTimer);
  }

  dropItem() {
    if (this.hasDroppedCrystal) return;
    this.hasDroppedCrystal = true;

    const scene = this.scene;
    const cristal = scene.physics.add.sprite(this.x, this.y, "cristal_bleu");
    cristal.setBounce(0.2);
    cristal.setCollideWorldBounds(true);
    scene.physics.add.collider(cristal, scene.calque_plateformes);

    scene.physics.add.overlap(scene.player, cristal, () => {
      fct.lifeManager.heal(scene, scene.maxVies);

      if (!scene.game.config.crystals)
        scene.game.config.crystals = { green: false, blue: false, violet: false };
      scene.game.config.crystals.blue = true;

      if (scene.sonCristal) scene.sonCristal.play({ volume: 1 });
      console.log("💎 Cristal bleu obtenu !");
      cristal.destroy();
    });
  }

  destroy(fromScene) {
    // Supprime tous les timers actifs
    if (this.activeTimers) {
      this.activeTimers.forEach(t => t.remove(false));
      this.activeTimers = [];
    }

    if (this.alert) this.alert.destroy();
    this.dropItem();

    if (this.scene && this.scene.porte_retour_boss?.body) {
      this.scene.porte_retour_boss.setVisible(true);
      this.scene.porte_retour_boss.body.enable = true;
    }

    // Stop musique boss
    if (this.bossMusic && this.bossMusic.isPlaying) this.bossMusic.stop();
    this.bossMusic = null;

    super.destroy(fromScene);
  }
}
