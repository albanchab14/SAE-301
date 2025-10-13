// entities/enemy.js
import * as fct from "../fonctions.js";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.direction = 1;

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.vie = 3;
    this.dropChance = 0;
  }

  takeDamage() {
    this.vie--;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(300, () => {
      if (!this.scene || !this.body) return; // éviter les erreurs
      this.clearTint();
    });
    if (this.vie <= 0) {
      this.dropHeart();
      this.destroy();
    }
  }
  
  // Chance de laisser tomber un coeur
  dropHeart() {
    const scene = this.scene;

    const rand = Math.random();
    console.log(`[${this.texture.key}] Drop roll: ${rand.toFixed(2)} / Chance: ${this.dropChance}`);

    if (rand < this.dropChance) {
      console.log('💖 a drop un cœur !');
      const heart = scene.physics.add.sprite(this.x, this.y - 20, "hero_hp", 0);
      heart.setScale(0.6);
      heart.setBounce(0.4);
      heart.setCollideWorldBounds(true);
      heart.body.setAllowGravity(true);

      // collision avec plateformes
      scene.physics.add.collider(heart, scene.calque_plateformes);

      // collecte
      scene.physics.add.overlap(scene.player, heart, (player, h) => {
        fct.lifeManager.heal(scene, 1);
        h.destroy();

        // petit feedback visuel
        const tween = scene.tweens.add({
          targets: player,
          tint: 0x00ff00,
          yoyo: true,
          duration: 200
        });

        if (scene.sonCristal) scene.sonCristal.play({ volume: 0.5 });
      });
    }
    else console.log('NOPE, pas drop de cœur...');
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

  // Détection du joueur
  hasLineOfSightTo(target, layer, precision = 10) {
    if (!target || !layer) return true;

    const line = new Phaser.Geom.Line(this.x, this.y, target.x, target.y);
    const points = line.getPoints(precision); // plus il y en a, plus c’est précis

    for (let i = 0; i < points.length; i++) {
      const tile = layer.getTileAtWorldXY(points[i].x, points[i].y, true);
      if (tile && tile.properties.estSolide) {
        return false; // une tuile bloque la vue
      }
    }
    return true;
  }
}
