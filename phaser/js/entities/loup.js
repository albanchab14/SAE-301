// entities/loup.js
import Enemy from "./enemy.js";

export default class Loup extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_loup");
    
    this.vie = 2;
    this.setGravityY(300);
    this.setVelocityX(this.direction*120);
  }

  update(platformLayer) {
    this.patrol(platformLayer);
    if (this.body.blocked.left) {
      this.setVelocityX(120); // rebond vers la droite
      this.direction = 1;
    } else if (this.body.blocked.right) {
      this.setVelocityX(-120); // rebond vers la droite
      this.direction = -1;
    }
  }
}
