// entities/boss1.js
import Enemy from "./enemy.js";

export default class Boss1 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss1", 0);

    this.vie = 10;
    this.setGravityY(300);
    this.setCollideWorldBounds(true);

    this.state = "patrol"; // patrol | pause | charge | stunned
    this.detectionRange = 250;
    this.chargeSpeed = 300;
    this.normalSpeed = 60;
    this.stunDuration = 2000;
    this.pauseDuration = 1000;
    this.damage = 3;

    this.setVelocityX(this.normalSpeed);

    // --- POINT D'EXCLAMATION ---
    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);
  }

  update(platformLayer, player) {
    this.alert.setPosition(this.x, this.y - this.height);
    switch (this.state) {
      case "patrol":
        this.patrol(platformLayer);
        if (this.body.blocked.left) {
          this.setVelocityX(120); // rebond vers la droite
          this.direction = 1;
        } else if (this.body.blocked.right) {
          this.setVelocityX(-120); // rebond vers la droite
          this.direction = -1;
        }
        this.alert.setVisible(false);
        this.checkPlayerDetection(player);
        this.playWalkAnimation();
        break;

      case "pause":
        // il ne bouge pas pendant la pause
        this.setVelocityX(0);
        this.alert.setVisible(true);
        this.anims.stop();
        break;

      case "charge":
        // il continue sa charge, gérée par la vélocité
        this.checkCollisionWithWall();
        this.alert.setVisible(false);
        this.playWalkAnimation();
        break;

      case "stunned":
        // il est bloqué, rien à faire ici
        this.setVelocityX(0);
        this.alert.setVisible(false);
        this.anims.stop();
        break;
    }
  }
  playWalkAnimation() {
    if (!this.body) return;
    if (this.direction === 1) {
      this.anims.play('boss1_walk_right', true);
    } else {
      this.anims.play('boss1_walk_left', true);
    }
  }

  checkPlayerDetection(player) {
    if (!this.body) return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance < this.detectionRange) {
      this.enterPause(player);
    }
  }

  enterPause(player) {
    if (!this.body) return;
    this.state = "pause";
    this.scene.time.delayedCall(this.pauseDuration, () => {
      this.startCharge(player);
    });
  }

  startCharge(player) {
    if (!this.body) return;
    this.state = "charge";
    this.direction = player.x > this.x ? 1 : -1;
    this.setVelocityX(this.direction * this.chargeSpeed);
  }

  checkCollisionWithWall() {
    if (!this.body) return;
    if (this.body.blocked.left || this.body.blocked.right) {
      this.enterStunned();
    }
  }

  enterStunned() {
    if (!this.body) return;
    this.state = "stunned";
    this.setVelocityX(0);
    this.setTint(0xffff66); // visuel simple pour montrer l'étourdissement
    this.scene.time.delayedCall(this.stunDuration, () => {
      this.clearTint();
      this.state = "patrol";
      this.setVelocityX(this.normalSpeed * this.direction);
    });
  }

  // Détruire le boss et son point d'exclamation
  destroy(fromScene) {
      if (this.alert) {
          this.alert.destroy();
      }
      if (this.scene.porte_retour_boss) {
        this.scene.porte_retour_boss.setVisible(true);
        this.scene.porte_retour_boss.body.enable = true;
      }
      super.destroy(fromScene);
  }

}
