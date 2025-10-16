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
    this.load.spritesheet("img_bossFinal", "./assets/bossfinal.png", { frameWidth: 72, frameHeight: 72 });
    this.load.audio("bossfinalmusic", "./assets/sfx/bossfinalfight.mp3");

    // === Porte ===
    this.load.image("img_porte4", "./assets/door4.png");
  }

  create() {
    // === MAP ===
    this.map4 = this.add.tilemap("finalmap");
    const tileset = this.map4.addTilesetImage("map4_tileset", "TuilesJeu4");
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
    this.porte_retour_boss = this.physics.add.staticSprite(200, 700, "img_porte4");
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
    this.bossfinalAlive = true;
    const boss = new BossFinal(this, 1100, 700);
    boss.bossMusic = this.sound.add("bossfinalmusic", { loop: true, volume: 0.5 });
    this.enemies.add(boss);
    this.physics.add.collider(this.enemies, this.calque_plateformes);

    // === ZONE DE DÉCLENCHEMENT DU COMBAT ===
    this.bossZone = this.add.zone(this.scale.width / 2 +300, this.scale.height / 2 +80, 900, 700);
    this.physics.world.enable(this.bossZone);
    this.bossZone.body.setAllowGravity(false);
    this.bossZone.body.setImmovable(true);

    this.bossNameText = this.add.text(this.scale.width / 2, this.scale.height / 1.2, "LA GARDIENNE CORROMPUE", {
      font: "48px Arial",
      fill: "#ff0000",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    this.physics.add.overlap(this.player, this.bossZone, () => {
      if (!this.bossTriggered) {
        this.bossTriggered = true;
        boss.bossMusic.play();
        this.tweens.add({
          targets: this.bossNameText,
          alpha: 1,
          duration: 400,
          yoyo: true,
          hold: 1500,
          onComplete: () => {
            this.bossNameText.setAlpha(0);
          }
        });
      }
    });

    // === COLLISION JOUEUR ↔ ENNEMI ===
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      const now = this.time.now;
      if (!player.lastHit || now - player.lastHit > 1000) {
        fct.lifeManager.retirerPV(this, 1);
        player.setTint(0xff0000);
        this.time.delayedCall(300, () => player.setTint(0xffffff));
        player.lastHit = now;

        if (this.game.config.pointsDeVie <= 0) {
          this.physics.pause();
          if (boss.bossMusic.isPlaying) boss.bossMusic.stop();
          this.scene.start("defaite");
        }
      }
    });
  }

  update() {
    this.updatePlayerMovement();
    this.handleAttack(this.enemies);

    this.enemies.children.iterate(enemy => {
      if (enemy instanceof BossFinal) {
        enemy.update(this.calque_plateformes, this.player);
      }
    });
  }
}
