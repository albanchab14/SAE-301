// scenes/niveau3.js
import * as fct from '../fonctions.js';
import Basescene from "./basescene.js";
import Bat from "../entities/bat.js";
import Boss3 from "../entities/boss3.js";
import Squelette from '../entities/squelette.js';
import Collectible from '../entities/collectible.js';
import Parchemin from "../entities/parchemin.js";


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
      this.load.audio("map3_fond", "./assets/sfx/map3_fond.mp3");
      this.load.audio("boss3music", "./assets/sfx/boss3fight.mp3");

    }
  
    create() {
      super.create();

      // --- Musique de fond ---
      if (!this.sound.get('map3_fond')) {
        this.mapMusic = this.sound.add('map3_fond', {
            loop: true,
            volume: 0.1
        });
      } else {
        this.mapMusic = this.sound.get('map3_fond');
      }
    
      // Démarrer la musique si elle n'est pas déjà en cours
      if (!this.mapMusic.isPlaying) {
        this.mapMusic.play();
      }

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
      
      // --- PLATEFORME MOBILE ---
      var plateforme_mobile = this.physics.add.sprite(4379, 390, "plateforme_mobile1");
      this.physics.add.collider(this.player, plateforme_mobile);
      plateforme_mobile.body.allowGravity = false;
      plateforme_mobile.body.immovable = true;

      var plateforme_mobile2 = this.physics.add.sprite(1102, 968, "plateforme_mobile1");
      this.physics.add.collider(this.player, plateforme_mobile2);
      plateforme_mobile2.body.allowGravity = false;
      plateforme_mobile2.body.immovable = true;

      var plateforme_mobile3 = this.physics.add.sprite(721, 1200, "plateforme_mobile1");
      this.physics.add.collider(this.player, plateforme_mobile3);
      plateforme_mobile3.body.allowGravity = false;
      plateforme_mobile3.body.immovable = true;

      // Tweens plateformes mobile 
      this.tweens.add({
        targets: [plateforme_mobile],
        paused: false,
        ease: "Linear",
        duration: 3000,
        yoyo: true,
        y: "-=256",
        delay: 0,
        hold: 1000,
        repeatDelay: 1000,
        repeat: -1
      });

      this.tweens.add({
        targets: [plateforme_mobile2],
        paused: false,
        ease: "Linear",
        duration: 5000,
        yoyo: true,
        y: "-=576",
        delay: 0,
        hold: 1000,
        repeatDelay: 1000,
        repeat: -1
      });

      this.tweens.add({
        targets: [plateforme_mobile3],
        paused: false,
        ease: "Linear",
        duration: 5000,
        yoyo: true,
        x: "+=600",
        delay: 0,
        hold: 1000,
        repeatDelay: 1000,
        repeat: -1
      });
          
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

      // Parchemin
      this.p3 = new Parchemin(this, 191, 1466, "parchemin3");
      this.parchemins.push(this.p3);

      this.parcheminHelpText = this.add.text(
        this.p3.x, this.p3.y - 30, "A", // 70 pixels au-dessus
        { font: "14px Arial", fill: "#fff", fontStyle: "bold", stroke: "#000", strokeThickness: 4 }
      ).setOrigin(0.5).setDepth(10).setVisible(false);

      // Crée le cercle autour
      this.parcheminCircle = this.add.graphics();
      this.parcheminCircle.lineStyle(2, 0xffffff); // bordure blanche
      this.parcheminCircle.strokeCircle(0, 0, 12); // cercle de rayon 20
      this.parcheminCircle.setDepth(9); // derrière le texte
      this.parcheminCircle.setVisible(false);
      this.parcheminCircle.setPosition(this.p3.x, this.p3.y - 30); // Même position que le texte

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
      this.anims.create({
        key: "boss3_attack_left",
        frames: this.anims.generateFrameNumbers("img_boss3", { start: 2, end: 4 }),
        frameRate: 8,
        repeat: 0
      });
      this.anims.create({
        key: "boss3_attack_right",
        frames: this.anims.generateFrameNumbers("img_boss3", { start: 5, end: 7 }),
        frameRate: 8,
        repeat: 0
      });

      
      this.enemies = this.add.group();
      this.projectilesGroup = this.physics.add.group();
      this.boss3Alive = true;
  
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
          if (this.boss3Alive) {
            const boss = new Boss3(this, obj.x, obj.y - 32);
            boss.sonCristal = this.sonCristal;
            boss.bossMusic = this.sound.add("boss3music", { loop: true, volume: 0.15 });
            this.enemies.add(boss);
          }
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
            // Arrêter la musique
            if (this.mapMusic) {
                this.mapMusic.stop();
            }
            this.scene.start("defaite");
          }
        }
      });

      // Collisions joueur ↔ projectiles
      this.physics.add.overlap(this.player, this.projectilesGroup, (player, projectile) => {
          console.log("Joueur touché par projectile");
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
              // Arrêter la musique
              if (this.mapMusic) {
                  this.mapMusic.stop();
              }
              this.scene.start("defaite");
            }
            projectile.destroy();
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
                  if (boss && !boss.bossMusic.isPlaying) {
                    boss.bossMusic.play();
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
      }
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

    this.enemies.children.iterate(enemy => {
      if (enemy instanceof Bat) enemy.update(this.player);
      if (enemy instanceof Squelette) enemy.update(this.player);
      if (enemy instanceof Boss3) enemy.update(this.player, this.projectilesGroup);
    });

    // Interactions
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
      if (this.physics.overlap(this.player, this.p3)) {
        this.p3.interact();
        return; // si on lit le parchemin, on bloque le reste
      }
      if (this.physics.overlap(this.player, this.porte_retour) || this.physics.overlap(this.player, this.porte_retour_boss)) {
        this.mapMusic.stop();
        this.scene.switch("selection");
      }
    }

    // Test de proximité ou d'overlap
    const isNearParchemin = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.p3.x, this.p3.y
    ) < 64 || this.physics.overlap(this.player, this.p3);

    this.parcheminHelpText.setVisible(isNearParchemin);
    this.parcheminHelpText.setPosition(this.p3.x, this.p3.y - 30);
    this.parcheminCircle.setVisible(isNearParchemin);
    this.parcheminCircle.setPosition(this.p3.x, this.p3.y - 30);

  }
}
