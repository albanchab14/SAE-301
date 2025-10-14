// scenes/niveaufinal.js
import * as fct from "../fonctions.js";
import BaseScene from "./basescene.js";

export default class NiveauFinal extends BaseScene {
  constructor() {
    super({ key: "NiveauFinal" });
  }

  preload() {
    // === Tileset & map ===
    this.load.image("TuilesJeu4", "./assets/tuilesJeu4.png");
    this.load.tilemapTiledJSON("finalmap", "./assets/finalmap.json");

    // (Préparation pour le boss final plus tard)
    // this.load.spritesheet("img_bossFinal", "assets/sprites/boss_final.png", { frameWidth: 128, frameHeight: 128 });
  }

  create() {
    // === MAP ===
    this.map = this.add.tilemap("finalmap");
    const tileset = this.map.addTilesetImage("map4_tileset", "TuilesJeu4");

    // Ordre des calques : du fond vers l'avant
    this.calque_background_4 = this.map.createLayer("calque_background_4", tileset);
    this.calque_background_2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);

    // Seules les plateformes sont interactives
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // === PHYSIQUE & CAMÉRA ===
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // === JOUEUR ===
    // (position de départ à ajuster selon ta map)
    this.player = this.createPlayer(300, 600);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // === INTERFACES & SYSTÈMES ===
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);
    this.createFragmentsText(this.game.config.collectedFragments ?? 0, 9);
    this.cameras.main.startFollow(this.player);
    this.createClavier();

    // === PORTE DE SORTIE (désactivée au début) ===
    this.porte_retour_boss = this.physics.add.staticSprite(4000, 1078, "img_porte_retour");
    this.porte_retour_boss.setVisible(false);
    this.porte_retour_boss.body.enable = false;

    // Interaction avec la porte (retour à la sélection)
    this.physics.add.overlap(this.player, this.porte_retour_boss, () => {
      if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
        this.scene.start("");
      }
    });

    // === BOSS FINAL (à ajouter plus tard) ===
    // Exemple :
    // this.bossFinal = new BossFinal(this, 3200, 950);
    // this.physics.add.collider(this.bossFinal, this.calque_plateformes);
    // this.physics.add.collider(this.player, this.bossFinal, this.onPlayerHit, null, this);

    // === Événements de réveil de scène ===
    this.events.on("wake", () => {
      fct.lifeManager.updateHearts(this);
      this.updateFragmentsText(this.game.config.collectedFragments ?? 0, 9);
    });
  }

  update() {
    // === Gestion du joueur ===
    this.updatePlayerMovement();
    this.handleAttack(this.enemies ?? []);

    // (aucun ennemi pour le moment)
  }
}
