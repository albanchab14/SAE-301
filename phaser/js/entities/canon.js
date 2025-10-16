// entities/canon.js
import Enemy from "./enemy.js";

export default class Canon extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_canon");

    this.vie = 2;
    this.dropChance = 0.25;
    this.nextShot = 0;
    this.cooldown = 2000; // tire toutes les 2 secondes
    this.range = 400; // distance de détection
    this.body.allowGravity = false; // reste fixe
    this.setImmovable(true);
    this.setOrigin(0.5, 0.5);

    this.defaultRotation = Phaser.Math.DegToRad(180); // par défaut : vers le bas
  }

  update(player, projectileGroup) {
    if (!player || !this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.range && this.hasLineOfSightTo(player, this.scene.calque_plateformes)) {
      // Seulement si le joueur est visible
      const angle = Math.atan2(dy, dx);
      this.setRotation(angle + Phaser.Math.DegToRad(90));

      if (this.scene.time.now > this.nextShot) {
        this.shoot(projectileGroup, angle);
        this.nextShot = this.scene.time.now + this.cooldown;
      }
    } else {
      // Retour à la rotation neutre si joueur pas visible ou trop loin
      this.scene.tweens.add({
        targets: this,
        rotation: this.defaultRotation,
        duration: 500,
        ease: "Sine.easeOut"
      });
    }
  }


  shoot(group, angle) {
    const projectile = group.create(this.x, this.y, "balle_canon");
    projectile.body.allowGravity = false;

    // Tir corrigé : pas besoin d’ajouter +90 ici, on garde le vrai angle pour la trajectoire
    const speed = 300;
    projectile.setRotation(angle + Phaser.Math.DegToRad(90));
    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // effet de recul
    const recoilDistance = 5;
    const recoilX = this.x - Math.cos(angle) * recoilDistance;
    const recoilY = this.y - Math.sin(angle) * recoilDistance;

    this.scene.tweens.add({
      targets: this,
      x: recoilX,
      y: recoilY,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut"
    });

    // Collision plateformes
    this.scene.physics.add.collider(projectile, this.scene.calque_plateformes, () => {
      projectile.destroy();
    });

    // Auto-destruction
    this.scene.time.delayedCall(4000, () => {
      if (projectile.active) projectile.destroy();
    });
  }
}
