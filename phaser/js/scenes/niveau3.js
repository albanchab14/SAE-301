// scenes/niveau3.js
import * as fct from '../fonctions.js';
import Basescene from "./basescene.js";
import Collectible from '../entities/collectible.js';

export default class Niveau3 extends Basescene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
      this.load.image("Phaser_tuilesdejeu3", "./assets/tuilesJeu3.png");
      this.load.tilemapTiledJSON("carte3", "./assets/map3.json");
      this.load.image("img_porte_retour", "./assets/door3.png");
    }
  
    create() {
      // Map
      this.map3 = this.add.tilemap("carte3");
      const tileset = this.map3.addTilesetImage("map3_tileset", "Phaser_tuilesdejeu3");
      this.calque_background2 = this.map3.createLayer("calque_background_2", tileset);
      this.calque_background  = this.map3.createLayer("calque_background", tileset);
      this.calque_plateformes = this.map3.createLayer("calque_plateformes", tileset);
      this.calque_echelles    = this.map3.createLayer("calque_echelles", tileset);
  
      // Collision plateformes
      this.calque_plateformes.setCollisionByProperty({ estSolide: true });
      this.physics.world.setBounds(0, 0, this.map3.widthInPixels, this.map3.heightInPixels);
  
      // Porte retour
      this.porte_retour = this.physics.add.staticSprite(100, 595, "img_porte3");
  
      // Joueur
      this.player = this.createPlayer(100, 600);
      this.physics.add.collider(this.player, this.calque_plateformes);
  
      // Caméra
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setBounds(0, 0, this.map3.widthInPixels, this.map3.heightInPixels);
      
      // --- TEXTE CADEAU ---
      this.add.text(
        this.map3.widthInPixels / 8,
        500,
        "Map en construction !\nEn guise de cadeau, voici les fragments de ce niveau.",
        { fontSize: "28px", fill: "#ffffff", align: "center" }
      ).setOrigin(0.5);

      // Vies
      this.events.on('wake', () => { // 1 appel au lancement de scène
        fct.lifeManager.updateHearts(this);
      });
      this.createHearts();
      fct.lifeManager.init(this, this.maxVies);
      
          
      // --- CREATION OBJETS ---
      
      const collectiblesLayer = this.map3.getObjectLayer('collectibles');
      this.collectiblesGroup = Collectible.createFromTilemap(this, collectiblesLayer);
      this.totalFragments = this.collectiblesGroup.getLength();
          
      // Affichage fragments
      if (typeof this.game.config.collectedFragments !== "number") {
        this.game.config.collectedFragments = 0;
      }
      
      this.createFragmentsText(this.game.config.collectedFragments, 9);
      this.events.on('wake', () => { // 1 appel au lancement de scène
        this.updateFragmentsText(this.game.config.collectedFragments, 9);
      });
      
      // Fragment collecté
      this.physics.add.overlap(this.player, this.collectiblesGroup, (player, collectible) => {
        collectible.collect();
        this.updateFragmentsText(this.game.config.collectedFragments, 9);
      }, null, this);

      // Clavier
      this.createClavier();

      // A ENLEVER
      this.time.addEvent({
          delay: 10000, // 10 sec en ms
          loop: true,
          callback: () => {
              // Suppose que ton sprite joueur s'appelle this.player
              console.log(`Position joueur : x=${this.player.x}, y=${this.player.y}`);
              // Tu peux aussi le stocker dans un tableau pour tracing ultérieur
              // this.positionsJoueur = this.positionsJoueur || [];
              // this.positionsJoueur.push({ x: this.player.x, y: this.player.y, t: this.time.now });
          }
      });
    }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    // Retour
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) && this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }
}
