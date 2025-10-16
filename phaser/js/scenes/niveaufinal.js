// scenes/niveaufinal.js
import * as fct from "../fonctions.js";
import BaseScene from "./basescene.js";
import BossFinal from "../entities/bossfinal.js";

export default class NiveauFinal extends BaseScene {
  constructor() {
    super({ key: "NiveauFinal" });
  }

  preload() {
    // === Tileset & map ===
    this.load.image("TuilesJeu4", "./assets/tuilesJeu4.png");
    this.load.tilemapTiledJSON("finalmap", "./assets/finalmap.json");

    // === Boss ===
    this.load.spritesheet("img_bossFinal", "./assets/bossfinal.png", { frameWidth: 49, frameHeight: 72 });
    this.load.audio("bossfinalmusic", "./assets/sfx/bossfinalfight.mp3");
    this.load.image("bossfinal_projectile", "./assets/bossfinal_projectile.png");

    // === Porte ===
    this.load.image("img_porte4", "./assets/door4.png");
  }

  create() {
    super.create();
    // === MAP ===
    this.map4 = this.add.tilemap("finalmap");
    const tileset = this.map4.addTilesetImage("map4_tileset", "TuilesJeu4");
    this.calque_background_3 = this.map4.createLayer("calque_background_3", tileset);
    this.calque_background_2 = this.map4.createLayer("calque_background_2", tileset);
    this.calque_background = this.map4.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map4.createLayer("calque_plateformes", tileset);
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    this.physics.world.setBounds(0, 0, this.map4.widthInPixels, this.map4.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map4.widthInPixels, this.map4.heightInPixels);

    // === JOUEUR ===
    this.player = this.createPlayer(200, 700);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // === INTERFACE ===
    this.createHearts();
    fct.lifeManager.init(this, this.maxVies);
    this.createFragmentsText(this.game.config.collectedFragments ?? 0, 9);
    this.cameras.main.startFollow(this.player);
    this.createClavier();

    // === PORTE SORTIE (cachée au début) ===
    this.porte_retour_boss = this.physics.add.staticSprite(200, 727, "img_porte4");
    this.porte_retour_boss.setVisible(false);
    this.porte_retour_boss.body.enable = false;

    this.physics.add.overlap(this.player, this.porte_retour_boss, () => {
      if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
        this.scene.start("victoire");
      }
    });

    // === ANIMATIONS BOSS ===
    this.anims.create({ key: "bossfinal_idle_left", frames: this.anims.generateFrameNumbers("img_bossFinal", { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "bossfinal_idle_right", frames: this.anims.generateFrameNumbers("img_bossFinal", { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "bossfinal_attack_left", frames: this.anims.generateFrameNumbers("img_bossFinal", { start: 8, end: 9 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "bossfinal_attack_right", frames: this.anims.generateFrameNumbers("img_bossFinal", { start: 10, end: 11 }), frameRate: 10, repeat: 0 });

    // === BOSS FINAL ===
    this.enemies = this.add.group();
    const boss = new BossFinal(this, 1100, 700);
    boss.bossMusic = this.sound.add("bossfinalmusic", { loop: true, volume: 0.2 });
    this.enemies.add(boss);
    this.physics.add.collider(this.enemies, this.calque_plateformes);
    boss.setScale(2);


    // === NOM DU BOSS ===
    this.bossNameText = this.add.text(this.scale.width / 2, 50, "LA GARDIENNE CORROMPUE", {
      font: "32px Arial",
      fill: "#ff0000",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setAlpha(0);

    // === ZONE DE DÉCLENCHEMENT DU COMBAT ===
    // --- ZONE DE DÉCLENCHEMENT DU BOSS FINAL ---
    const zones = this.map4.getObjectLayer("zones");
    const bossObject = zones?.objects.find(obj => obj.name === "bossFinalZone");

if (bossObject) {
  this.bossZone = this.add.zone(
    bossObject.x + bossObject.width / 2,
    bossObject.y + bossObject.height / 2,
    bossObject.width,
    bossObject.height
  );

  this.physics.world.enable(this.bossZone);
  this.bossZone.body.setAllowGravity(false);
  this.bossZone.body.setImmovable(true);

  // --- TEXTE DU BOSS ---
  this.bossNameText = this.add.text(
    this.scale.width / 2,
    50,
    bossObject.properties?.find(p => p.name === "bossname")?.value || "LA GARDIENNE CORROMPUE",
    {
      font: "64px Arial",
      fill: "#ff0000",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 6
    }
  )
  .setOrigin(0.5, 0)
  .setScrollFactor(0)
  .setAlpha(0);

  // Barre de vie du boss (sous le nom)
  const barWidth = 600;
  const barHeight = 24;

  this.bossHealthBarBg = this.add.rectangle(
    this.scale.width / 2,
    this.bossNameText.y + 80,
    barWidth,
    barHeight,
    0x222222
  )
  .setOrigin(0.5, 0.5)
  .setScrollFactor(0)
  .setAlpha(0);  // cachée au départ

  this.bossHealthBar = this.add.rectangle(
    this.scale.width / 2 - barWidth / 2,
    this.bossNameText.y + 80,
    barWidth,
    barHeight,
    0x06c80f
  )
  .setOrigin(0, 0.5)
  .setScrollFactor(0)
  .setAlpha(0);  // cachée au départ



  // --- Détection de l’entrée du joueur ---
  this.physics.add.overlap(this.player, this.bossZone, () => {
    if (!this.bossNameShown) {
      this.bossNameShown = true;

      // Musique du boss
      if (!boss.bossMusic.isPlaying) {
        boss.bossMusic.play({ loop: true });
        if (this.mapMusic?.isPlaying) this.mapMusic.pause();
      }

      // Apparition stylée du nom du boss
      this.bossNameText.setAlpha(0);
      this.bossNameText.setScale(0.5);

      // Mettre aussi la barre invisible et petite
      this.bossHealthBar.setAlpha(0);
      this.bossHealthBarBg.setAlpha(0);

      this.tweens.add({
        targets: [this.bossNameText, this.bossHealthBar, this.bossHealthBarBg],
        alpha: 1,
        scaleX: 1, // pour la barre, elle se “déroule”
        scaleY: 1, // pour le nom
        ease: "Back.Out",
        duration: 1200,
      });

      
      // Petit tremblement de caméra pour l'effet dramatique
      this.cameras.main.shake(400, 0.005);


      // Activation du boss
      boss.setActive(true);
      boss.setVisible(true);

      // Affichage progressif de la barre de vie
      this.tweens.add({
        targets: [this.bossHealthBar, this.bossHealthBarBg],
        alpha: 1,
        duration: 800,
        ease: "Power2"
      });
    }
  });
}


    // === COLLISIONS JOUEUR ↔ ENNEMIS ===
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      const now = this.time.now;
      if (!player.lastHit || now - player.lastHit > 1000) {
        fct.lifeManager.retirerPV(this, 1);
        player.setTint(0xff0000);
        this.time.delayedCall(300, () => player.setTint(0xffffff));
        player.lastHit = now;

        if (this.game.config.pointsDeVie <= 0) {
          this.physics.pause();
          if (boss.bossMusic?.isPlaying) boss.bossMusic.stop();
          this.scene.start("defaite");
        }
      }
    });

    // === COLLISIONS JOUEUR ↔ PROJECTILES DU BOSS ===
    this.physics.add.overlap(this.player, boss.projectilesGroup, (player, projectile) => {
      if (!projectile.active) return;
      projectile.destroy();
      fct.lifeManager.retirerPV(this, 1);
      player.setTint(0xff0000);
      this.time.delayedCall(300, () => player.setTint(0xffffff));

      if (this.game.config.pointsDeVie <= 0) {
        this.physics.pause();
        if (boss.bossMusic?.isPlaying) boss.bossMusic.stop();
        this.scene.start("defaite");
      }
    });

    this.boss = boss; // pour y accéder dans update()
  }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    this.enemies.children.iterate(enemy => {
      if (enemy.active && enemy instanceof BossFinal) {
        enemy.update(this.calque_plateformes, this.player);
      }
    });



    if (this.boss && this.boss.active) {
      const ratio = Phaser.Math.Clamp(this.boss.vie / this.boss.maxVie, 0, 1);
      this.bossHealthBar.width = 600 * ratio;  // correspond à la largeur max
      // changement de couleur selon les PV
      let color;
      if (ratio > 0.5) color = 0x06c80f;       // vert
      else if (ratio > 0.2) color = 0xf8c200;  // orange
      else color = 0xdb222a;                   // rouge
      this.bossHealthBar.fillColor = color;
    }

  }
}
