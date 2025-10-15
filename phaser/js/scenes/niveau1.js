// scenes/niveau1.js
import * as fct from '../fonctions.js';

import Basescene from "./basescene.js";
import Loup from "../entities/loup.js";
import Bandit from "../entities/bandit.js";
import Boss1 from "../entities/boss1.js";
import Collectible from '../entities/collectible.js';
import Parchemin from "../entities/parchemin.js";

export default class Niveau1 extends Basescene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    super.preload();
    this.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("carte", "./assets/map.json");
    this.load.spritesheet("img_bandit", "./assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    this.load.image("img_porte_retour", "./assets/door1.png");
    this.load.image("couteau", "./assets/couteau.png");
    this.load.spritesheet("img_loup", "./assets/loup.png", { frameWidth: 96, frameHeight: 57 });
    this.load.spritesheet("img_boss1", "./assets/boss1.png", { frameWidth: 70, frameHeight: 94 });
    this.load.image("background_fixe", "./assets/fond_map_1.png");

    this.load.audio("boss1music", "./assets/sfx/boss1fight.mp3");
    this.load.audio("map1_fond", "./assets/sfx/map1_fond.mp3");
    this.load.image("parchemin1", "assets/parchemin1.png");

  }

  create() {
    super.create();

    // --- Musique de fond ---
    if (!this.mapMusic) {
      // Première fois qu'on lance la scène
      this.mapMusic = this.sound.add("map1_fond", { loop: true, volume: 0.3 });
      this.mapMusic.play();
    }
    this.events.on('wake', () => {
      if (this.mapMusic && !this.mapMusic.isPlaying) {
        this.mapMusic.play();
      }
    });

    // backgroung map
    const bg = this.add.image(0, 0, "background_fixe")
        .setOrigin(0, 0)
        .setScrollFactor(0);
    // Mise à l’échelle si besoin :
    bg.displayWidth = this.scale.width;
    bg.displayHeight = this.scale.height;


    // Map
    this.map = this.add.tilemap("carte");
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.calque_background = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles = this.map.createLayer("calque_echelles", tileset);

    // Collisions plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Portes retour
    this.porte_retour = this.physics.add.staticSprite(100, 605, "img_porte_retour");
    this.porte_retour_boss = this.physics.add.staticSprite(2050, 412, "img_porte_retour");
    this.porte_retour_boss.setVisible(false);
    this.porte_retour_boss.body.enable = false;
    

    // Joueur, placé en (100, 600) / (3000,150 pour boss)
    this.player = this.createPlayer(3000, 150);
    this.physics.add.collider(this.player, this.calque_plateformes);


    // Caméra
    this.cameras.main.startFollow(this.player);
    
    // Vies
    this.events.on('wake', () => { // 1 appel au lancement de scène
      fct.lifeManager.updateHearts(this);
    });
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);

    // --- CREATION OBJETS ---

    const collectiblesLayer = this.map.getObjectLayer('collectibles');
    this.collectiblesGroup = Collectible.createFromTilemap(this, collectiblesLayer);
    this.totalFragments = this.collectiblesGroup.getLength();

    // Affichage fragments
    if (typeof this.game.config.collectedFragments !== "number") {
      this.game.config.collectedFragments = 0;
    }
    if (typeof this.game.config.collectedCristals !== "number") {
      this.game.config.collectedCristals = 0;
    }

    this.createFragmentsText(this.game.config.collectedFragments, 9);
    
    this.events.on('wake', () => {
      this.updateFragmentsText(this.game.config.collectedFragments, 9);
      this.player.setPosition(3000, 150); // (3000,150) position de boss
      // Si tu veux remettre la caméra sur le joueur
      this.cameras.main.startFollow(this.player);
    });

    // Fragment collecté
    this.physics.add.overlap(this.player, this.collectiblesGroup, (player, collectible) => {
      collectible.collect();
      this.updateFragmentsText(this.game.config.collectedFragments, 9);
    }, null, this);

    // Parchemin
    this.p1 = new Parchemin(this, 1585, 1020, "parchemin1");
    this.parchemins.push(this.p1);

    // --- ENNEMIS ---

    // --- Animations ---

    this.anims.create({
      key: 'loup_walk_left',
      frames: this.anims.generateFrameNumbers('img_loup', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'loup_walk_right',
      frames: this.anims.generateFrameNumbers('img_loup', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'bandit_walk_left',
      frames: this.anims.generateFrameNumbers('img_bandit', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'bandit_walk_right',
      frames: this.anims.generateFrameNumbers('img_bandit', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    // Boss
    this.anims.create({
      key: 'boss1_walk_left',
      frames: this.anims.generateFrameNumbers('img_boss1', { start: 0, end: 4 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'boss1_walk_right',
      frames: this.anims.generateFrameNumbers('img_boss1', { start: 5, end: 9 }),
      frameRate: 6,
      repeat: -1
    });

    // Création
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
      if (obj.properties?.find(p => p.name === "type")?.value === "boss1") {
        const boss = new Boss1(this, obj.x, obj.y - 32);
        boss.sonCristal = this.sonCristal; 
        boss.bossMusic = this.sound.add("boss1music", { loop: true, volume: 0.5 });
        this.enemies.add(boss);
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

    // collision joueur projectiles
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


    // ------ CREATION TEXTE BOSS --------
    const zones = this.map.getObjectLayer("zones");
    const bossObject = zones.objects.find(obj => obj.name === "boss1Zone");

    this.bossZone = this.add.zone(
      bossObject.x + bossObject.width / 2, 
      bossObject.y + bossObject.height / 2, 
      bossObject.width, 
      bossObject.height
    );

    this.physics.world.enable(this.bossZone);
    this.bossZone.body.setAllowGravity(false);
    this.bossZone.body.setImmovable(true);

    // Crée le texte du boss
    this.bossNameText = this.add.text(this.scale.width/1.25, this.scale.height/1.1, bossObject.properties?.find(p => p.name === "bossname")?.value || "BOSS", {
        font: "64px Arial",
        fill: "#ff0000",
        fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    // Détecte l’entrée du joueur dans la zone du boss
    this.physics.add.overlap(this.player, this.bossZone, () => {
        if (!this.bossNameShown) {
            this.bossNameShown = true;

            // Jouer la musique du boss
            const boss = this.enemies.getChildren().find(e => e instanceof Boss1);
            if (boss && !boss.bossMusic.isPlaying) {
                boss.bossMusic.play({ loop: true });
                // Mettre la musique de fond en pause
                if (this.mapMusic && this.mapMusic.isPlaying) {
                    this.mapMusic.pause();
                }
            } 
            this.bossNameText.setAlpha(1);
            this.tweens.add({
                targets: this.bossNameText,
                alpha: 0,
                duration: 3000,
                delay: 1500
            });
        }
    });

    // Arrêter la musique si la scène change
    this.events.on('sleep', () => {
      if (this.mapMusic && this.mapMusic.isPlaying) {
        this.mapMusic.stop();
      }
    });

    // Affiche la position du joueur toutes les 5 secondes
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        console.log(`Position du joueur: x=${this.player.x}, y=${this.player.y}`);
      },
      callbackScope: this,
      loop: true
    });
  }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);
    super.update();
    this.enemies.children.iterate(enemy => {
      if (enemy instanceof Loup) enemy.update(this.calque_plateformes, this.player);
      if (enemy instanceof Bandit) enemy.update(this.player, this.projectiles, this.calque_plateformes);
      if (enemy instanceof Boss1) enemy.update(this.calque_plateformes, this.player);
    });

    // Interaction porte
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
      if (this.physics.overlap(this.player, this.p1)) {
        this.p1.interact();
        return; // si on lit le parchemin, on bloque le reste
      }
      if (this.physics.overlap(this.player, this.porte_retour) || this.physics.overlap(this.player, this.porte_retour_boss)) {
        this.scene.switch("selection");
      }
    }
    // Retour
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
    (this.physics.overlap(this.player, this.porte_retour) || this.physics.overlap(this.player, this.porte_retour_boss))) {
      this.mapMusic.stop();
      this.scene.switch("selection");
    }
  }
}