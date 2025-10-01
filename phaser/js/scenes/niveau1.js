// scenes/niveau1.js
import * as fct from '../fonctions.js';

import Basescene from "./basescene.js";
import Loup from "../entities/loup.js";
import Bandit from "../entities/bandit.js";
import Collectible from '../entities/collectible.js';

export default class Niveau1 extends Basescene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    this.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("carte", "./assets/map.json");
    this.load.spritesheet("img_bandit", "./assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    this.load.image("img_porte_retour", "./assets/door1.png");
    this.load.image("couteau", "./assets/couteau.png");
    this.load.spritesheet("img_loup", "./assets/loup.png", { frameWidth: 96, frameHeight: 57 });
  }

  create() {
    // Map
    this.map = this.add.tilemap("carte");
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
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

    // Objets
    const collectiblesLayer = this.map.getObjectLayer('collectibles');
    this.collectiblesGroup = Collectible.createFromTilemap(this, collectiblesLayer);
    this.totalFragments = this.collectiblesGroup.getLength();
    this.collectedFragments = 0;

    this.createFragmentsText(this.collectedFragments, this.totalFragments);

    this.physics.add.overlap(this.player, this.collectiblesGroup, (player, collectible) => {
      collectible.collect();
      this.updateFragmentsText(this.collectedFragments, this.totalFragments);
    }, null, this);

    // Ennemis
    this.enemies = this.add.group();
    this.projectiles = this.physics.add.group();

    const ennemis = this.map.getObjectLayer("ennemis")?.objects || [];
    ennemis.forEach(obj => {
      const dir = obj.properties?.find(p => p.name === "direction")?.value || "droite";
      if (obj.properties?.find(p => p.name === "type")?.value === "loup") {
        this.enemies.add(new Loup(this, obj.x, obj.y-32));
      }
      if (obj.properties?.find(p => p.name === "type")?.value === "bandit") {
        this.enemies.add(new Bandit(this, obj.x, obj.y-32));
      }
    });

    this.physics.add.collider(this.enemies, this.calque_plateformes);

    // Collisions joueur ↔ ennemis
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      const now = this.time.now;
      if (!player.lastHit || now - player.lastHit > 1000) { // 1 seconde d'immunité
        fct.lifeManager.retirerPV(this, 1);
        fct.lifeManager.updateHearts(this);
        player.setTint(0xff0000);
        this.time.delayedCall(300, () => player.setTint(0xffffff));
        player.lastHit = now;

        if (this.game.config.pointsDeVie <= 0) {
          this.physics.pause();
          this.scene.start("defaite");
        }
      }
    });


    this.physics.add.overlap(this.player, this.projectiles, (player, projectile) => {
      const now = this.time.now;
      if (!player.lastHit || now - player.lastHit > 1000) {
        fct.lifeManager.retirerPV(this, 1);
        player.setTint(0xff0000);
        this.time.delayedCall(300, () => player.setTint(0xffffff));
        player.lastHit = now;

        if (this.game.config.pointsDeVie <= 0) {
          this.physics.pause();
          this.scene.start("defaite");
        }
        projectile.destroy();
      }
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
          console.log("Vie lue dans registry:", this.game.config.pointsDeVie);
      this.scene.switch("selection");
    }
  }
}
