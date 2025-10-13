// entities/evilknight.js
import Enemy from "./enemy.js";

export default class EvilKnight extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_chevalier_mechant");
    
    this.vie = 5;
    this.setGravityY(300);
    this.setVelocityX(this.direction*80);
  }

  update(platformLayer) {
    this.patrol(platformLayer);
    if (this.body.blocked.left) {
      this.setVelocityX(80); // rebond vers la droite
      this.direction = 1;
    } else if (this.body.blocked.right) {
      this.setVelocityX(-80); // rebond vers la droite
      this.direction = -1;
    }
    this.playWalkAnimation();
  }
  playWalkAnimation() {
    if (!this.body) return;
    if (this.direction === 1) {
      this.anims.play('evilknight_walk_right', true);
    } else {
      this.anims.play('evilknight_walk_left', true);
    }
  }
}
