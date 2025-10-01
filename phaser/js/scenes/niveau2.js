// scenes/niveau2.js
import * as fct from '../fonctions.js';

import Basescene from "./basescene.js";
import Loup from "../entities/loup.js";
import Bandit from "../entities/bandit.js";

export default class Niveau2 extends Basescene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.image("Phaser_tuilesdejeu", "../assets/selectionJeu.png");
    this.load.tilemapTiledJSON("carte2", "../assets/map2.json");
    this.load.spritesheet("img_bandit", "../assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    this.load.image("img_porte_retour", "../assets/door1.png");
    this.load.image("couteau", "../assets/couteau.png");
    this.load.spritesheet("img_loup", "../assets/loup.png", { frameWidth: 96, frameHeight: 57 });
  }

  create() {
    // Map
    this.map = this.add.tilemap("carte2");
    const tileset = this.map.addTilesetImage("map2_tileset", "Phaser_tuilesdejeu");
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.calque_background = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles = this.map.createLayer("calque_echelles", tileset);
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 605, "img_porte_retour");

    // Joueur
    this.player = this.createPlayer(100, 600);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Vie et UI
    this.createHearts();

    // Caméra
    this.cameras.main.startFollow(this.player);

    // Ennemis
    this.enemies = this.add.group();
    this.projectiles = this.physics.add.group();

    const ennemis = this.map.getObjectLayer("ennemis")?.objects || [];
    ennemis.forEach(obj => {
      const dir = obj.properties?.find(p => p.name === "direction")?.value || "droite";
      if (obj.properties?.find(p => p.name === "type")?.value === "loup") {
        this.enemies.add(new Loup(this, obj.x, obj.y, dir));
      }
      if (obj.properties?.find(p => p.name === "type")?.value === "bandit") {
        this.enemies.add(new Bandit(this, obj.x, obj.y, dir));
      }
    });

    this.physics.add.collider(this.enemies, this.calque_plateformes);

    // Collisions joueur ↔ ennemis
    this.physics.add.overlap(this.player, this.enemies, () => this.player.takeDamage(1));
    this.physics.add.overlap(this.player, this.projectiles, (p, projectile) => {
      this.player.takeDamage(1);
      projectile.destroy();
    });

    // Clavier
    this.createClavier();
  }

  update() {
    
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    this.enemies.children.iterate(enemy => {
      if (enemy instanceof Loup) enemy.update(this.calque_plateformes);
      if (enemy instanceof Bandit) enemy.update(this.player, this.projectiles, this.calque_plateformes);
    });

    // Retour
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
        this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }
}
