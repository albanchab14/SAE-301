// entities/bandit.js
import Enemy from "./enemy.js";

export default class Bandit extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_bandit");
    this.vie = 3;
    this.setGravityY(300);
    this.setVelocityX(this.direction*80);

    this.nextShot = 0;
  }

  update(player, projectileGroup, platformLayer) {
    this.patrol(platformLayer);
    
    if (this.body.blocked.left) {
      this.setVelocityX(80); // rebond vers la droite
      this.direction = 1;
    } else if (this.body.blocked.right) {
      this.setVelocityX(-80); // rebond vers la droite
      this.direction = -1;
    }

    // IA : tire si joueur proche
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 300) {
      this.setVelocityX(0);
      if (this.scene.time.now > this.nextShot) {
        this.launchProjectile(projectileGroup, player);
        this.nextShot = this.scene.time.now + 2000;
      }
    }
    else {
      // si joueur pas proche, reprend sa patrouille avec vitesse stockée
      if (this.body.velocity.x === 0) {
        this.setVelocityX(this.direction*80);
      }
    }
    this.playWalkAnimation();
  }

  playWalkAnimation() {
    if (!this.body) return;
    if (this.direction === 1) {
      this.anims.play('bandit_walk_right', true);
    } else {
      this.anims.play('bandit_walk_left', true);
    }
  }

  launchProjectile(group, player) {
    const projectile = group.create(this.x, this.y, "couteau");
    projectile.body.allowGravity = false;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    projectile.setRotation(angle + Math.PI);
    projectile.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

    this.scene.physics.add.collider(projectile, this.scene.calque_plateformes, () => {
      projectile.destroy();
    });
  }
}
