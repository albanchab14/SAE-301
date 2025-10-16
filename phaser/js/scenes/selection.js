// scenes/selection.js
import * as fct from "../fonctions.js";
import BaseScene from "./basescene.js";
import Parchemin from "../entities/parchemin.js";

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
    super.create();
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


    // Calque des échelles est désactivé au départ
    this.calque_echelles.visible = false;
    this.calque_echelles.active = false;
    this.echellesActives = false;

    // Portes vers niveaux
    this.porte1 = this.physics.add.staticSprite(100, 601, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(640, 597, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(1150, 595, "img_porte3");
    this.portefinale = this.physics.add.staticSprite(640, 208, "img_porte4");
    this.portefinale.setScale(1.25);
    
    // Joueur (100, 600)
    this.player = this.createPlayer(640, 200);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Fragments collectés
    if (typeof this.game.config.collectedFragments !== "number") {
      this.game.config.collectedFragments = 0;
    }
  
    this.createFragmentsText(this.game.config.collectedFragments, 9);
    this.events.on('wake', () => { // 1 appel au lancement de scène
      this.updateFragmentsText(this.game.config.collectedFragments, 9);
    });
    
    // Cristaux
    this.game.config.crystals.green = false;
    this.game.config.crystals.blue = false;
    this.game.config.crystals.violet = false;

    this.events.on('wake', () => {
      // Met à jour le cristal
      if (this.game.config.crystals.green) {
        this.miniCristalGreen = this.add.image(
          this.porte1.x,
          this.porte1.y - this.porte1.height / 2 - 16,
          "cristal_vert"
        ).setScale(0.5).setDepth(this.porte1.depth + 1);
        this.objectifText.setVisible(false);
      }
      if (this.game.config.crystals.blue) {
        this.miniCristalBlue = this.add.image(
            this.porte2.x,
            this.porte2.y - this.porte2.height / 2 - 16,
            "cristal_bleu"
        ).setScale(0.5).setDepth(this.porte2.depth + 1);
        this.objectifText.setVisible(false);
      }
      if (this.game.config.crystals.violet) {
        this.miniCristalViolet = this.add.image(
            this.porte3.x,
            this.porte3.y - this.porte3.height / 2 - 16,
            "cristal_violet"
        ).setScale(0.5).setDepth(this.porte3.depth + 1);
        this.objectifText.setVisible(false);
      }
    });

    // Parchemin
    this.p0 = new Parchemin(this, 550, 250, "parchemin0");
    this.parchemins.push(this.p0);

    this.parcheminHelpText = this.add.text(
      this.p0.x, this.p0.y - 30, "A", // 70 pixels au-dessus
      { font: "14px Arial", fill: "#fff", fontStyle: "bold", stroke: "#000", strokeThickness: 4 }
    ).setOrigin(0.5).setDepth(10).setVisible(false);

    // Crée le cercle autour
    this.parcheminCircle = this.add.graphics();
    this.parcheminCircle.lineStyle(2, 0xffffff); // bordure blanche
    this.parcheminCircle.strokeCircle(0, 0, 12); // cercle de rayon 20
    this.parcheminCircle.setDepth(9); // derrière le texte
    this.parcheminCircle.setVisible(false);
    this.parcheminCircle.setPosition(this.p0.x, this.p0.y - 30); // Même position que le texte

    // Vie et UI
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);


    this.events.on('wake', () => { // 1 appel au lancement de scène
      fct.lifeManager.updateHearts(this);
    });

    // Caméra
    this.cameras.main.startFollow(this.player);

    // Texte objectif
    this.objectifText = this.add.text(
      this.map.widthInPixels / 2,
      this.map.heightInPixels / 2 -50,
      "Chaque niveau renferme un cristal puissant.\nRécupérez-les pour finir votre quête !",
      {
        align: "center",
        font: "18px Arial",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold"
      }
    )
    .setOrigin(0.5)
    .setDepth(10);

    // Clavier
    this.createClavier();    
  }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    super.update();
    
    // Active le calque des échelles uniquement si les 3 cristaux sont récupérés
    if (
      this.game.config.crystals.green &&
      this.game.config.crystals.blue &&
      this.game.config.crystals.violet
    ) {
      if (!this.calque_echelles.visible) {
        this.calque_echelles.visible = true;
        this.calque_echelles.active = true;
        this.echellesActives = true;
        console.log("💎 Tous les cristaux obtenus ! Les échelles apparaissent !");
      }
    }

    // Test de proximité ou d'overlap
    const isNearParchemin = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.p0.x, this.p0.y
    ) < 64 || this.physics.overlap(this.player, this.p0);

    this.parcheminHelpText.setVisible(isNearParchemin);
    this.parcheminHelpText.setPosition(this.p0.x, this.p0.y - 30);
    this.parcheminCircle.setVisible(isNearParchemin);
    this.parcheminCircle.setPosition(this.p0.x, this.p0.y - 30);

    if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
      if (this.physics.overlap(this.player, this.p0)) {
        this.p0.interact();
        return; // si on lit le parchemin, on bloque le reste
      }
      if (this.physics.overlap(this.player, this.porte1)) {
        this.scene.switch("niveau1");
      }
      if (this.physics.overlap(this.player, this.porte2)) {
        this.scene.switch("niveau2");
      }
      if (this.physics.overlap(this.player, this.porte3)) {
        this.scene.switch("niveau3");
      }
      if (this.physics.overlap(this.player, this.portefinale)) {
        this.portefinale.play("open_door");
        this.time.delayedCall(1000, () => {
          this.scene.switch("NiveauFinal");
        });
      }
    }
  }
}
