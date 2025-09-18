import * as fct from "./fonctions.js";

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    // Map et tileset du lobby
    this.load.image("selection_tileset", "./assets/selectionJeu.png");
    this.load.tilemapTiledJSON("map_selection", "./assets/map_selection.json");

    // Joueur
    this.load.spritesheet("img_perso", "./assets/dude.png", { frameWidth: 53, frameHeight: 58 });

    // Portes vers les niveaux
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    // Carte & tileset
    this.map = this.add.tilemap("map_selection");
    const tileset = this.map.addTilesetImage("selection_tileset", "selection_tileset");

    // Calques
    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

    // Collision plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Joueur
    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Les 3 portes
    this.porte1 = this.physics.add.staticSprite(100, 620, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(675, 620, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(1150, 620, "img_porte3");

    // Clavier Q/D/Z/S + espace
    this.clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Animations joueur
    if (!this.anims.exists("anim_tourne_gauche")) {
      this.anims.create({
        key: "anim_tourne_gauche",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!this.anims.exists("anim_tourne_droite")) {
      this.anims.create({
        key: "anim_tourne_droite",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!this.anims.exists("anim_face")) {
      this.anims.create({
        key: "anim_face",
        frames: [{ key: "img_perso", frame: 4 }],
        frameRate: 20
      });
    }
  }

  update() {
    // Déplacement horizontal
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face");
    }

    // Gestion des échelles
    const tile = this.calque_echelles.getTileAtWorldXY(this.player.x, this.player.y, true); // ✅ utilise le calque stocké
    if (tile && tile.properties.estEchelle) {
      this.player.setGravityY(0);
      if (this.clavier.up.isDown) {
        this.player.setVelocityY(-160);
      } else if (this.clavier.down.isDown) {
        this.player.setVelocityY(160);
      } else {
        this.player.setVelocityY(0);
      }
    }

    // Saut
    if (this.clavier.jump.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-290);
    }

    // Porte vers les niveaux
    if (Phaser.Input.Keyboard.JustDown(this.clavier.jump)) {
      if (this.physics.overlap(this.player, this.porte1)) this.scene.switch("niveau1");
      if (this.physics.overlap(this.player, this.porte2)) this.scene.switch("niveau2");
      if (this.physics.overlap(this.player, this.porte3)) this.scene.switch("niveau3");
    }
  }
}
