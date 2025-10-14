// scenes/niveau2.js
import * as fct from '../fonctions.js';
import Basescene from "./basescene.js";
import EvilKnight from "../entities/evilknight.js";
import Canon from '../entities/canon.js';
import Gargouille from '../entities/gargouille.js';
import Boss2 from "../entities/boss2.js";
import Collectible from '../entities/collectible.js';


export default class Niveau2 extends Basescene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    super.preload();
    this.load.image("Phaser_tuilesdejeu2", "./assets/selectionJeu.png");
    this.load.tilemapTiledJSON("carte2", "./assets/map2.json");
    this.load.image("img_porte_retour", "./assets/door2.png");

    this.load.image("img_canon", "./assets/canon.png");
    this.load.image("balle_canon", "./assets/canonball.png");
    this.load.spritesheet("img_gargouille", "./assets/gargouille.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("img_gargouille_vole", "./assets/gargouille_vole.png", { frameWidth: 64, frameHeight: 34 });
    this.load.spritesheet("img_chevalier_mechant", "./assets/chevalier_mechant.png", { frameWidth: 36, frameHeight: 61 });

    this.load.image("img_levier", "./assets/levier.png");
    this.load.image("pont_levis1", "./assets/pont_levis1.png");
    this.load.image("plateforme_mobile1", "./assets/plateforme_mobile1.png");

    this.load.spritesheet("img_boss2", "./assets/boss2.png", { frameWidth: 111, frameHeight: 73 });
    this.load.spritesheet("fireball", "./assets/fireball.png", { frameWidth: 48, frameHeight: 24 });
    this.load.audio("boss2music", "./assets/sfx/boss2fight.mp3");
    // this.load.audio("boss2_shoot", "./assets/sfx/fireball.mp3");

  }

  create() {
    super.create();
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

    // Porte retours
    this.porte_retour = this.physics.add.staticSprite(100, 600, "img_porte_retour");

    this.porte_retour_boss = this.physics.add.staticSprite(4300, 1078, "img_porte_retour"); // ajuste x/y selon ta map
    this.porte_retour_boss.setVisible(false);
    this.porte_retour_boss.body.enable = false;


    // Joueur (spawn original : (100, 600) / spawn boss : (3300, 900))
    this.player = this.createPlayer(3300, 900);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Caméra
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map2.widthInPixels, this.map2.heightInPixels);

    // vies
    this.events.on('wake', () => { // 1 appel au lancement de scène
      fct.lifeManager.updateHearts(this);
    });
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);
    
    // --- PLATEFORMES MOBILES ---

    var pont_levis1 = this.physics.add.sprite(782, 650, "pont_levis1");
    this.physics.add.collider(this.player, pont_levis1);
    pont_levis1.body.allowGravity = false;
    pont_levis1.body.immovable = true;

    var plateforme_mobile = this.physics.add.sprite(3040, 904, "plateforme_mobile1");
    this.physics.add.collider(this.player, plateforme_mobile);
    plateforme_mobile.body.allowGravity = false;
    plateforme_mobile.body.immovable = true;
    

    // --- CREATION LEVIERS ---
    this.leversGroup = this.physics.add.staticGroup();

    let lever1 = this.leversGroup.create(310, 222, "img_levier");
    lever1.number = 1;
    lever1.activated = false;
    
    // --- TWEENS ---
    
    // Pont levis
    this.tween_mouvement = this.tweens.add({
      targets: [pont_levis1],
      paused: true,
      ease: "Linear",
      duration: 3000,
      yoyo: false,
      x: "-=160",
      delay: 0,
    });

    // Plateforme mobile
    this.tweens.add({
      targets: [plateforme_mobile],
      paused: false,
      ease: "Linear",
      duration: 3000,
      yoyo: true,
      y: "-=350",
      delay: 0,
      hold: 1000,
      repeatDelay: 1000,
      repeat: -1
    });

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
      this.player.setPosition(3400, 900); // spawn original : (100, 600) / spawn boss : (3300, 900))
      // Si tu veux remettre la caméra sur le joueur
      this.cameras.main.startFollow(this.player);
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

    // Boss 2
    this.anims.create({
      key: "boss2_idle_left",
      frames: [{ key: "img_boss2", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: "boss2_idle_right",
      frames: [{ key: "img_boss2", frame: 1 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: "boss2_attack_left",
      frames: this.anims.generateFrameNumbers("img_boss2", { start: 2, end: 5 }),
      frameRate: 4,
      repeat: 0
    });

    this.anims.create({
      key: "boss2_attack_right",
      frames: this.anims.generateFrameNumbers("img_boss2", { start: 6, end: 9 }),
      frameRate: 4,
      repeat: 0
    });
    this.anims.create({
      key: "boss2_jump_left",
      frames: this.anims.generateFrameNumbers("img_boss2", { start: 10, end: 13 }),
      frameRate: 2,
      repeat: 0
    });
    this.anims.create({
      key: "boss2_jump_right",
      frames: this.anims.generateFrameNumbers("img_boss2", { start: 14, end: 17 }),
      frameRate: 2,
      repeat: 0
    });
    // Animation boule de feu
    this.anims.create({
      key: "fireball_anim",
      frames: this.anims.generateFrameNumbers("fireball", { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1
    });





    this.enemies = this.add.group();
    this.projectilesGroup = this.physics.add.group();


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
      if (obj.properties?.find(p => p.name === "type")?.value === "boss2") {
        const boss = new Boss2(this, obj.x, obj.y - 32);
        boss.sonCristal = this.sonCristal;
        boss.bossMusic = this.sound.add("boss2music", { loop: true, volume: 0.5 });
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
            this.scene.start("defaite");
          }
          projectile.destroy();
        }
    });
    

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

    const bossZoneObj = this.map2.getObjectLayer("zones")?.objects.find(o => o.name === "boss2Zone");
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

      this.bossNameText = this.add.text(this.scale.width/1.25, this.scale.height/1.1,
        bossZoneObj.properties?.find(p => p.name === "bossname")?.value || "CERBERUS", {
          font: "64px Arial",
          fill: "#ff0000",
          fontStyle: "bold"
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

      this.physics.add.overlap(this.player, this.bossZone, () => {
        if (!this.bossNameShown) {
          this.bossNameShown = true;
          const boss = this.enemies.getChildren().find(e => e instanceof Boss2);
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
    this.handleAttack(this.enemies, this.leversGroup);
    this.enemies.children.iterate(enemy => {
      if (enemy instanceof EvilKnight) enemy.update(this.calque_plateformes, this.player);
      if (enemy instanceof Canon) enemy.update(this.player, this.projectiles);
      if (enemy instanceof Gargouille) enemy.update(this.player);
      if (enemy instanceof Boss2) enemy.update(this.calque_plateformes, this.player, this.projectilesGroup);
    });

    // Retour
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
    (this.physics.overlap(this.player, this.porte_retour) || this.physics.overlap(this.player, this.porte_retour_boss))) {
      console.log("PV restants :", this.game.config.pointsDeVie);
      this.scene.switch("selection");
    }
  }
}