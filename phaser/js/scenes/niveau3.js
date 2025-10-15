// scenes/niveau3.js
import * as fct from '../fonctions.js';
import Basescene from "./basescene.js";
import Bat from "../entities/bat.js";
import Boss3 from "../entities/boss3.js";
import Squelette from '../entities/squelette.js';
import Collectible from '../entities/collectible.js';

export default class Niveau3 extends Basescene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
      this.load.image("Phaser_tuilesdejeu3", "./assets/tuilesJeu3.png");
      this.load.tilemapTiledJSON("carte3", "./assets/map3.json");
      this.load.spritesheet("img_bat", "./assets/bat.png", { frameWidth: 32, frameHeight: 18 });
      this.load.spritesheet("skeleton_idle", "./assets/skeleton_idle.png", { frameWidth: 34, frameHeight: 46 });
      this.load.spritesheet("skeleton_walk", "./assets/skeleton_walk.png", { frameWidth: 39, frameHeight: 48 });
      this.load.spritesheet("skeleton_attack", "./assets/skeleton_attack.png", { frameWidth: 58, frameHeight: 47 });

      this.load.spritesheet("img_boss3", "./assets/boss3.png", { frameWidth: 50, frameHeight: 72 });
      this.load.image("dark_projectile", "./assets/dark_projectile.png");
      this.load.audio("boss3music", "./assets/sfx/boss3fight.mp3");

    }
  
    create() {
      super.create();
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
      
      this.porte_retour_boss = this.physics.add.staticSprite(4400, 1524, "img_porte3"); // ajuste x/y selon ta map
      this.porte_retour_boss.setVisible(false);
      this.porte_retour_boss.body.enable = false;
      // Joueur (départ : (100, 600), boss : (4250, 800))
      this.player = this.createPlayer(4250, 800);
      this.physics.add.collider(this.player, this.calque_plateformes);
  
      // Caméra
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setBounds(0, 0, this.map3.widthInPixels, this.map3.heightInPixels);

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
        this.player.setPosition(4250, 800); // spawn original : (100, 600) / spawn boss : (4250, 800))
        this.cameras.main.startFollow(this.player);
      });
      
      // Fragment collecté
      this.physics.add.overlap(this.player, this.collectiblesGroup, (player, collectible) => {
        collectible.collect();
        this.updateFragmentsText(this.game.config.collectedFragments, 9);
      }, null, this);

      // --- ENNEMIS ---

      // Animations (1ere : bat)
      this.anims.create({
        key: "bat_fly_left",
        frames: this.anims.generateFrameNumbers("img_bat", { start: 0, end: 4 }),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: "bat_fly_right",
        frames: this.anims.generateFrameNumbers("img_bat", { start: 5, end: 9 }),
        frameRate: 8,
        repeat: -1
      });
      // Squelette
      this.anims.create({
        key: "skeleton_idle_left",
        frames: this.anims.generateFrameNumbers("skeleton_idle", { start: 4, end: 7 }),
        frameRate: 4,
        repeat: -1
      });
      this.anims.create({
        key: "skeleton_idle_right",
        frames: this.anims.generateFrameNumbers("skeleton_idle", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });

      this.anims.create({
        key: "skeleton_walk_left",
        frames: this.anims.generateFrameNumbers("skeleton_walk", { start: 8, end: 15 }),
        frameRate: 6,
        repeat: -1
      });
      this.anims.create({
        key: "skeleton_walk_right",
        frames: this.anims.generateFrameNumbers("skeleton_walk", { start: 0, end: 7 }),
        frameRate: 6,
        repeat: -1
      });
      this.anims.create({
        key: "skeleton_attack_left",
        frames: this.anims.generateFrameNumbers("skeleton_attack", { start: 5, end: 9 }),
        frameRate: 8,
        repeat: 0
      });
      this.anims.create({
        key: "skeleton_attack_right",
        frames: this.anims.generateFrameNumbers("skeleton_attack", { start: 0, end: 4 }),
        frameRate: 8,
        repeat: 0
      });

      // Boss3
      this.anims.create({
        key: "boss3_idle_left",
        frames: [{ key: "img_boss3", frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
      this.anims.create({
        key: "boss3_idle_right",
        frames: [{ key: "img_boss3", frame: 1 }],
        frameRate: 1,
        repeat: -1
      });

      
      this.enemies = this.add.group();
      this.projectilesGroup = this.physics.add.group();
  
      const ennemis = this.map3.getObjectLayer("ennemis")?.objects || [];
      ennemis.forEach(obj => {
        const dir = obj.properties?.find(p => p.name === "direction")?.value || "droite";
        if (obj.properties?.find(p => p.name === "type")?.value === "bat") {
          this.enemies.add(new Bat(this, obj.x, obj.y - 16));
        }
        if (obj.properties?.find(p => p.name === "type")?.value === "skeleton") {
          this.enemies.add(new Squelette(this, obj.x, obj.y));
        }
        if (obj.properties?.find(p => p.name === "type")?.value === "boss3") {
          const boss = new Boss3(this, obj.x, obj.y - 32);
          boss.sonCristal = this.sonCristal;
          boss.bossMusic = this.sound.add("boss3music", { loop: true, volume: 0.5 });
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

      // Clavier
      this.createClavier();

      const bossZoneObj = this.map3.getObjectLayer("zones")?.objects.find(o => o.name === "boss3Zone");
      if (bossZoneObj) {
          this.bossZone = this.add.zone(
              bossZoneObj.x + bossZoneObj.width / 2,
              bossZoneObj.y + bossZoneObj.height / 2,
              bossZoneObj.width,
              bossZoneObj.height
          );
          this.physics.world.enable(this.bossZone);
          this.bossZone.body.setAllowGravity(false);
          this.bossZone.body.setImmovable(true);

          this.bossNameText = this.add.text(this.scale.width / 1.25, this.scale.height / 1.1,
              bossZoneObj.properties?.find(p => p.name === "bossname")?.value || "VAMPIRE", {
                  font: "64px Arial",
                  fill: "#ff00ff",
                  fontStyle: "bold"
              }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

          this.physics.add.overlap(this.player, this.bossZone, () => {
              if (!this.bossNameShown) {
                  this.bossNameShown = true;
                
                  const boss = this.enemies.getChildren().find(e => e instanceof Boss3);
                  if (boss && !boss.bossMusic.isPlaying) boss.bossMusic.play();

                  this.bossNameText.setAlpha(1);
                  this.tweens.add({
                      targets: this.bossNameText,
                      alpha: 0,
                      duration: 3000,
                      delay: 1500
                  });
              }
          });
      }
    }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    this.enemies.children.iterate(enemy => {
      if (enemy instanceof Bat) enemy.update(this.player);
      if (enemy instanceof Squelette) enemy.update(this.player);
      if (enemy instanceof Boss3) enemy.update(this.player);
    });

    // Retour
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
    (this.physics.overlap(this.player, this.porte_retour) || this.physics.overlap(this.player, this.porte_retour_boss))) {
      console.log("PV restants :", this.game.config.pointsDeVie);
      this.scene.switch("selection");
    }
  }
}
