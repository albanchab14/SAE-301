// entities/bossfinal.js
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class BossFinal extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_bossFinal");
    
    this.vie = 10;
    this.setGravityY(400);
    this.setCollideWorldBounds(true);
    this.direction = -1;
    this.state = "idle";

    this.attackCooldown = 1500;
    this.lastAttack = 0;
    this.damage = 1;

    this.hasDroppedItem = false;
  }

  update(platformLayer, player) {
    if (!this.body) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const now = this.scene.time.now;

    // Se tourne vers le joueur
    this.direction = player.x > this.x ? 1 : -1;

    // Attaque si proche
    if (distance < 150 && now - this.lastAttack > this.attackCooldown) {
      this.attack(player);
      this.lastAttack = now;
    }

    // Animation selon l’état
    if (this.state === "idle") {
      this.playIdle();
    } else if (this.state === "attack") {
      this.playAttack();
    }
  }

  playIdle() {
    if (this.direction === 1)
      this.anims.play("bossfinal_idle_right", true);
    else
      this.anims.play("bossfinal_idle_left", true);
  }

  playAttack() {
    if (this.direction === 1)
      this.anims.play("bossfinal_attack_right", true);
    else
      this.anims.play("bossfinal_attack_left", true);
  }

  attack(player) {
    this.state = "attack";
    this.scene.time.delayedCall(400, () => {
      if (!this.body) return;
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance < 120) {
        fct.lifeManager.retirerPV(this.scene, this.damage);
      }
    });
    this.scene.time.delayedCall(800, () => {
      if (this.body) this.state = "idle";
    });
  }

  takeDamage(amount = 1) {
    this.vie -= amount;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(200, () => this.clearTint());

    if (this.vie <= 0) this.die();
  }

  die() {
    if (this.hasDroppedItem) return;
    this.hasDroppedItem = true;

    this.scene.cameras.main.shake(300, 0.01);

    // Arrêt de la musique de boss + reprise musique map
    if (this.bossMusic) {
      this.bossMusic.stop();
    }
    if (this.scene.mapMusic) {
      this.scene.mapMusic.resume();
    }

    // Affiche la porte de sortie
    if (this.scene.porte_retour_boss) {
      this.scene.porte_retour_boss.setVisible(true);
      this.scene.porte_retour_boss.body.enable = true;
    }

    // Destruction du boss
    this.destroy();
  }
}
