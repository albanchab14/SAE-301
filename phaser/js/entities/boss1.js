// entities/boss1.js
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class Boss1 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss1", 0);

    // --- PARAMETRES VIE ---
    this.maxVie = 5; // nombre de points de vie max
    this.vie = this.maxVie;

    // --- BARRE DE VIE ---
    this.lifeBar = scene.add.graphics();
    this.lifeBar.setDepth(10);
    this.updateLifeBar();

    this.setGravityY(300);
    this.setCollideWorldBounds(true);

    this.state = "patrol";
    this.detectionRange = 250;
    this.chargeSpeed = 300;
    this.normalSpeed = 60;
    this.stunDuration = 2000;
    this.pauseDuration = 1000;
    this.damage = 3;

    this.setVelocityX(this.normalSpeed);

    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    this.activeTimers = [];
    this.hasDroppedCrystal = false;
  }

  updateLifeBar() {
    const barWidth = 60;
    const barHeight = 8;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height - 26;

    this.lifeBar.clear();
    this.lifeBar.fillStyle(0x333333, 1);
    this.lifeBar.fillRect(x, y, barWidth, barHeight);

    const percent = Math.max(this.vie / this.maxVie, 0);
    const color = percent > 0.5 ? 0x06c80f : (percent > 0.2 ? 0xf8c200 : 0xdb222a);
    this.lifeBar.fillStyle(color, 1);
    this.lifeBar.fillRect(x, y, barWidth * percent, barHeight);

    // (optionnel) Afficher le nombre de vie restant
    // this.lifeBar.lineStyle(2, 0xffffff, 1);
    // this.lifeBar.strokeRect(x, y, barWidth, barHeight);
  }

  takeDamage(amount = 1) {
    this.vie = Math.max(0, this.vie - amount);
    this.updateLifeBar();
    if (this.vie <= 0) {
      this.destroy();
    }
  }

  update(platformLayer, player) {
    if (!this.body) return;
    this.alert.setPosition(this.x, this.y - this.height);
    this.updateLifeBar();

    switch (this.state) {
      case "patrol":
        this.patrol(platformLayer);
        if (this.body.blocked.left) {
          this.setVelocityX(120);
          this.direction = 1;
        } else if (this.body.blocked.right) {
          this.setVelocityX(-120);
          this.direction = -1;
        }
        this.alert.setVisible(false);
        this.checkPlayerDetection(player);
        this.playWalkAnimation();
        break;

      case "pause":
        this.setVelocityX(0);
        this.alert.setVisible(true);
        this.anims.stop();
        break;

      case "charge":
        this.checkCollisionWithWall();
        this.alert.setVisible(false);
        this.playWalkAnimation();
        break;

      case "stunned":
        this.setVelocityX(0);
        this.alert.setVisible(false);
        this.anims.stop();
        break;
    }
  }

  playWalkAnimation() {
    if (!this.body) return;
    if (this.direction === 1) this.anims.play('boss1_walk_right', true);
    else this.anims.play('boss1_walk_left', true);
  }

  checkPlayerDetection(player) {
    if (!this.body) return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance < this.detectionRange) this.enterPause(player);
  }

  enterPause(player) {
    if (!this.body) return;
    this.state = "pause";

    const timer = this.scene.time.delayedCall(this.pauseDuration, () => {
      if (!this.body) return;
      this.startCharge(player);
    });
    this.activeTimers.push(timer);
  }

  startCharge(player) {
    if (!this.body) return;
    this.state = "charge";
    this.direction = player.x > this.x ? 1 : -1;
    this.setVelocityX(this.direction * this.chargeSpeed);
  }

  checkCollisionWithWall() {
    if (!this.body) return;
    if (this.body.blocked.left || this.body.blocked.right) this.enterStunned();
  }

  enterStunned() {
    if (!this.body) return;
    this.state = "stunned";
    this.setVelocityX(0);
    this.setTint(0xffff66);

    const timer = this.scene.time.delayedCall(this.stunDuration, () => {
      if (!this.body) return;
      this.clearTint();
      this.state = "patrol";
      this.setVelocityX(this.normalSpeed * this.direction);
    });
    this.activeTimers.push(timer);
  }

  dropItem() {
    const scene = this.scene;
    if (this.hasDroppedCrystal) return;
    this.hasDroppedCrystal = true;
    const cristal = scene.physics.add.sprite(this.x, this.y, "cristal_vert");

    cristal.setBounce(0.2);
    cristal.setCollideWorldBounds(true);
    scene.physics.add.collider(cristal, scene.calque_plateformes);

    const player = scene.player;

    scene.physics.add.overlap(player, cristal, () => {
      console.log("Cristal ramassé !");
      fct.lifeManager.heal(scene, scene.maxVies || 5);

      if (scene.sonCristal) {
        scene.sonCristal.play({ volume: 1 });
      }
      cristal.destroy();

      if (!scene.game.config.crystals) {
        scene.game.config.crystals = { green: false, blue: false, violet: false };
      }
      scene.game.config.crystals.green = true;

      if (scene.game.config.crystals.green = true) {
        console.log("Cristal vert obtenu !");
      }
    });
  }

  destroy(fromScene) {
    if (this.activeTimers) {
      this.activeTimers.forEach(t => t.remove());
      this.activeTimers = [];
    }
    if (this.alert) this.alert.destroy();

    // Détruit la barre de vie
    if (this.lifeBar) this.lifeBar.destroy();

    if (this.scene && this.scene.porte_retour_boss?.body) {
      this.scene.porte_retour_boss.setVisible(true);
      this.scene.porte_retour_boss.body.enable = true;
    }

    if (this.bossMusic) {
      try {
        if (this.bossMusic.isPlaying) this.bossMusic.stop();
        this.bossMusic.destroy();
      } catch(e) {
        console.warn("Boss music déjà détruite:", e);
      }
      this.bossMusic = null;
    }
    if (this.scene && this.scene.mapMusic) {
      this.scene.mapMusic.resume();
    }

    this.dropItem();
    super.destroy(fromScene);
  }
}
