// scenes/selection.js
import * as fct from "../fonctions.js";
import BaseScene from "./basescene.js";

export default class Selection extends BaseScene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    // Maps & portes du lobby
    this.load.image("selection_tileset", "./assets/selectionJeu.png");
    this.load.tilemapTiledJSON("map_selection", "./assets/map_selection.json");
    }


  create() {
    // Map
    this.map = this.add.tilemap("map_selection");
    const tileset = this.map.addTilesetImage("selection_tileset", "selection_tileset");
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles = this.map.createLayer("calque_echelles", tileset);
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Portes vers niveaux
    this.porte1 = this.physics.add.staticSprite(100, 601, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(640, 597, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(1150, 595, "img_porte3");
    
    // Joueur
    this.player = this.createPlayer(100, 600);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Fragments collectés
    if (typeof this.game.config.collectedFragments !== "number") {
      this.game.config.collectedFragments = 0;
    }
  
    this.createFragmentsText(this.game.config.collectedFragments, 9);
    this.events.on('wake', () => { // 1 appel au lancement de scène
      this.updateFragmentsText(this.game.config.collectedFragments, 9);
    });
  
    this.events.on('wake', () => {
      // Met à jour le cristal
      if (this.game.config.crystals.green) {
          if (!this.miniCristalGreen) {
              this.miniCristalGreen = this.add.image(
                  this.porte1.x,
                  this.porte1.y - this.porte1.height / 2 - 16,
                  "cristal_vert"
              ).setScale(0.5).setDepth(this.porte1.depth + 1);
          }
      }
    });




    // Vie et UI
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);


    this.events.on('wake', () => { // 1 appel au lancement de scène
      fct.lifeManager.updateHearts(this);
    });

    // Caméra
    this.cameras.main.startFollow(this.player);

    // Clavier
    this.createClavier();    
  }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
      if (this.physics.overlap(this.player, this.porte1)) {
        this.scene.switch("niveau1");
      }
      if (this.physics.overlap(this.player, this.porte2)) {
        this.scene.switch("niveau2");
      }
      if (this.physics.overlap(this.player, this.porte3)) {
        this.scene.switch("niveau3");
      }
    }
  }
}
