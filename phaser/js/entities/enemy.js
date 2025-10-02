// entities/enemy.js
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.direction = 1;

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.vie = 3;
  }

  takeDamage() {
    this.vie--;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(300, () => {
      if (!this.scene || !this.body) return; // éviter les erreurs
      this.clearTint();
    });
    if (this.vie <= 0) this.destroy();
  }
  
  patrol(platformLayer) {
  this.direction = this.body.velocity.x > 0 ? 1 : -1;
  const nextX = this.x + this.direction * (this.width / 2 + 1);
  const nextY = this.y + this.height / 2 + 1;

  const tile = platformLayer.getTileAtWorldXY(nextX, nextY);

  if (!tile) {
    // Bord de plateforme, obligé d'inverser la vitesse
    this.setVelocityX(-this.direction * this.body.velocity.x);
  }
}

}
