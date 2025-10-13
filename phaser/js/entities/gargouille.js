// entities/gargouille.js
import Enemy from "./enemy.js";

export default class Gargouille extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_gargouille");

    this.vie = 3;
    this.body.setAllowGravity(false);
    this.setImmovable(true);

    this.isAwake = false;  // endormie au début
    this.range = 300;      // rayon de détection
    this.speed = 120;
    this.startY = y;       // pour la replacer si besoin
    this.direction = 1;    // 1 = droite, -1 = gauche

    // Animation par défaut (statue)
    this.play("gargouille_idle");
  }

  update(player) {
    if (!player || !this.active) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // --- Si joueur proche, la gargouille se réveille ---
    if (!this.isAwake && distance < this.range) {
      this.isAwake = true;
      this.body.setAllowGravity(true);
    }

    // --- Si réveillée, elle poursuit le joueur ---
    if (this.isAwake) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const angle = Math.atan2(dy, dx);

      // Applique le mouvement
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);

      // Détecte direction horizontale pour l'animation
      this.direction = dx >= 0 ? 1 : -1;

      // Joue la bonne animation
      if (this.direction === 1) {
        this.anims.play("gargouille_fly_right", true);
        this.body.setSize(64, 36);
      } else {
        this.anims.play("gargouille_fly_left", true);
        this.body.setSize(64, 36);
      }
    }
  }
}
