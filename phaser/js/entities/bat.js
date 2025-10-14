import Enemy from "./enemy.js";

export default class Bat extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_bat");

    this.setScale(1.2);
    this.vie = 1;
    this.dropChance = 0.15;
    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;

    this.baseY = y;
    this.amplitude = 30; 
    this.speed = 70;     
    this.direction = Phaser.Math.Between(0, 1) ? 1 : -1;

    this.detectionRange = 250;
    this.attackSpeed = 250;
    this.returnSpeed = 100;
    this.state = "patrol";

    this.timeOffset = Phaser.Math.Between(0, 1000);
    this.wallCheckDistance = 20;

    this.attackCooldown = 2000;
    this.lastAttackTime = 0;

    this.attackDelay = 400; // délai avant de foncer
    this.attackTimer = null; // pour stocker le timer
  }

  update(player) {
    if (!this.body) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const now = this.scene.time.now;

    // 🧠 Détection du joueur
    if (
      this.state === "patrol" &&
      distance < this.detectionRange &&
      now - this.lastAttackTime > this.attackCooldown
    ) {
      this.prepareAttack(player);
      this.lastAttackTime = now;
    }

    switch (this.state) {
      case "patrol":
        this.patrolMovement();
        break;
      case "attack":
        this.attackPlayer(player);
        break;
      case "return":
        this.returnToBase();
        break;
      case "charging":
        // elle reste immobile pendant la préparation
        this.body.setVelocity(0, 0);
        break;
    }

    this.playFlyAnimation();
  }

  prepareAttack(player) {
    this.state = "charging";
    this.body.setVelocity(0, 0);

    // Optionnel : petit effet visuel (secousse)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      yoyo: true,
      duration: this.attackDelay,
      ease: "Sine.easeInOut"
    });

    // Après un petit délai → elle fonce
    this.attackTimer = this.scene.time.delayedCall(this.attackDelay, () => {
      this.state = "attack";
    });
  }

  patrolMovement() {
    this.x += this.direction * this.speed * 0.016;
    this.y = this.baseY + Math.sin((this.scene.time.now + this.timeOffset) * 0.005) * this.amplitude;

    const tileAhead = this.scene.calque_plateformes.getTileAtWorldXY(
      this.x + this.direction * this.wallCheckDistance,
      this.y,
      true
    );

    if (tileAhead && tileAhead.properties.estSolide) {
      this.direction *= -1;
    }

    this.body.setVelocity(0, 0);
  }

  attackPlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.scene.physics.velocityFromRotation(angle, this.attackSpeed, this.body.velocity);

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance < 30) {
      this.state = "return";
    }
  }

  returnToBase() {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.x, this.baseY);
    this.scene.physics.velocityFromRotation(angle, this.returnSpeed, this.body.velocity);

    if (Math.abs(this.y - this.baseY) < 10) {
      this.state = "patrol";
      this.body.setVelocity(0, 0);
    }
  }

  playFlyAnimation() {
    if (this.direction === 1) {
      this.anims.play("bat_fly_right", true);
    } else {
      this.anims.play("bat_fly_left", true);
    }
  }
}
