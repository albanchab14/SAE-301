// scenes/niveau2.js
import * as fct from '../fonctions.js';
import Basescene from "./basescene.js";
import EvilKnight from "../entities/evilknight.js";
import Canon from '../entities/canon.js';
import Gargouille from '../entities/gargouille.js';
import Collectible from '../entities/collectible.js';


export default class Niveau2 extends Basescene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.image("Phaser_tuilesdejeu2", "./assets/selectionJeu.png");
    this.load.tilemapTiledJSON("carte2", "./assets/map2.json");
    this.load.image("img_porte_retour", "./assets/door1.png");

    this.load.image("img_canon", "./assets/canon.png");
    this.load.image("balle_canon", "./assets/canonball.png");
    this.load.spritesheet("img_gargouille", "./assets/gargouille.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("img_gargouille_vole", "./assets/gargouille_vole.png", { frameWidth: 64, frameHeight: 36 });
    this.load.spritesheet("img_chevalier_mechant", "./assets/chevalier_mechant.png", { frameWidth: 36, frameHeight: 61 });

    this.load.image("img_levier", "./src/assets/levier.png");
  }

  create() {
    // Map
    this.map2 = this.add.tilemap("carte2");
    const tileset = this.map2.addTilesetImage("map2_tileset", "Phaser_tuilesdejeu2");
    this.calque_background2 = this.map2.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map2.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map2.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map2.createLayer("calque_echelles", tileset);

    // Collision plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.physics.world.setBounds(0, 0, this.map2.widthInPixels, this.map2.heightInPixels);

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 605, "img_porte_retour");

    // Joueur
    this.player = this.createPlayer(100, 600);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Caméra
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map2.widthInPixels, this.map2.heightInPixels);
    
    // --- TEXTE CADEAU ---
    this.add.text(
      this.map2.widthInPixels / 8,
      500,
      "Map en construction !\nEn guise de cadeau, voici les fragments de ce niveau.",
      { fontSize: "28px", fill: "#ffffff", align: "center" }
    ).setOrigin(0.5);

    // vies
    this.events.on('wake', () => { // 1 appel au lancement de scène
      fct.lifeManager.updateHearts(this);
    });
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);
    
    var levier = this.physics.add.staticSprite(30, 196, "img_levier");
    // --- CREATION OBJETS ---
    
    const collectiblesLayer = this.map2.getObjectLayer('collectibles');
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
      
    
    // --- ENNEMIS ---

    // Animations
    this.anims.create({
      key: 'evilknight_walk_left',
      frames: this.anims.generateFrameNumbers('img_chevalier_mechant', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: 'evilknight_walk_right',
      frames: this.anims.generateFrameNumbers('img_chevalier_mechant', { start: 4, end: 7 }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "gargouille_idle",
      frames: [{ key: "img_gargouille", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: "gargouille_fly_left",
      frames: this.anims.generateFrameNumbers("img_gargouille_vole", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "gargouille_fly_right",
      frames: this.anims.generateFrameNumbers("img_gargouille_vole", { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });



    this.enemies = this.add.group();
    this.projectiles = this.physics.add.group();

    const ennemis = this.map2.getObjectLayer("ennemis")?.objects || [];
    ennemis.forEach(obj => {
      const dir = obj.properties?.find(p => p.name === "direction")?.value || "droite";
      if (obj.properties?.find(p => p.name === "type")?.value === "evil_knight") {
        this.enemies.add(new EvilKnight(this, obj.x, obj.y, dir));
      }
      if (obj.properties?.find(p => p.name === "type")?.value === "canon") {
        this.enemies.add(new Canon(this, obj.x, obj.y, dir));
      }
      if (obj.properties?.find(p => p.name === "type")?.value === "gargouille") {
        this.enemies.add(new Gargouille(this, obj.x, obj.y, dir));
      }
    });

    this.physics.add.collider(this.enemies, this.calque_plateformes);

    // Collisions joueur ↔ ennemis
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      const now = this.time.now;
      if (!player.lastHit || now - player.lastHit > 1000) { // 1 seconde d'immunité
        fct.lifeManager.retirerPV(this, 1);
        player.setTint(0xff0000);
        this.time.delayedCall(300, () => player.setTint(0xffffff));
        player.lastHit = now;

        if (this.game.config.pointsDeVie <= 0) {
          this.physics.pause();
          this.game.config.collectedFragments = 0;
          this.game.config.collectedCristals = 0;
          this.bossNameShown = false;
          if (this.miniCristalGreen) {
            this.miniCristalGreen.destroy();
            this.miniCristalGreen = null;
          }
          this.scene.start("defaite");
        }
      }
    });
    
    // Collisions joueur ↔ projectiles
    this.physics.add.overlap(this.player, this.projectiles, (player, projectile) => {
          const now = this.time.now;
          if (!player.lastHit || now - player.lastHit > 1000) {
            fct.lifeManager.retirerPV(this, 1);
            player.setTint(0xff0000);
            this.time.delayedCall(300, () => player.setTint(0xffffff));
            player.lastHit = now;
    
            if (this.game.config.pointsDeVie <= 0) {
              this.physics.pause();
              this.game.config.collectedFragments = 0;
              this.game.config.collectedCristals = 0;
              this.bossNameShown = false;
              if (this.miniCristalGreen) {
                this.miniCristalGreen.destroy();
                this.miniCristalGreen = null;
              }
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
      if (enemy instanceof EvilKnight) enemy.update(this.calque_plateformes, this.player);
      if (enemy instanceof Canon) enemy.update(this.player, this.projectiles);
      if (enemy instanceof Gargouille) enemy.update(this.player);
    });

    // Retour
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) && this.physics.overlap(this.player, this.porte_retour)) {
      console.log("PV restants :", this.game.config.pointsDeVie);
      this.scene.switch("selection");
    }
  }
}