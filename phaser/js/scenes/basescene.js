// basescene.js
import * as fct from "../fonctions.js";

export default class Basescene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.maxVies = 5;
  }

  preload() {
    // --- GLOBAL PRELOAD ---
    // Joueur
    this.load.spritesheet("img_perso", "../assets/dude.png", { frameWidth: 46, frameHeight: 58 });
    this.load.spritesheet("hero_hp", "../assets/hero_hp.png", { frameWidth: 30, frameHeight: 28 });
    this.load.spritesheet("img_perso_attack", "./assets/dude_attack.png", { frameWidth: 64, frameHeight: 57 });
    this.load.image("img_porte1", "../assets/door1.png");
    this.load.image("img_porte2", "../assets/door2.png");
    this.load.image("img_porte3", "../assets/door3.png");

    this.load.spritesheet('miroir_fragments', '../assets/miroir_fragments.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('son_attaque', './assets/sfx/hit.mp3');

  }
  // --- Crée le joueur et initialise ses propriétés ---
  createPlayer(x, y) {
    // Sprite
    this.player = this.physics.add.sprite(x, y, "img_perso");
    this.player.setBounce(0.2).setCollideWorldBounds(true);

    // Flags
    this.player.canAttack = true;
    this.player.direction = "droite";
    this.player.isAttacking = false;
    this.player.lastHit = 0;

    // --- Crée les animations si elles n'existent pas ---
    if (!this.anims.exists("anim_face")) {
      this.anims.create({
        key: "anim_face",
        frames: [{ key: "img_perso", frame: 4 }],
        frameRate: 10
      });

      this.anims.create({
        key: "anim_tourne_gauche",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: "anim_tourne_droite",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
      // Attaques
      this.anims.create({
        key: "attack_gauche",
        frames: this.anims.generateFrameNumbers("img_perso_attack", { start: 2, end: 0 }), // 4 → 1
        frameRate: 25,
        repeat: 0
      });
      this.anims.create({
        key: "attack_droite",
        frames: this.anims.generateFrameNumbers("img_perso_attack", { start: 5, end: 7 }), // 5 → 8
        frameRate: 40,
        repeat: 0
      });
    }

    this.sonAttaque = this.sound.add('son_attaque');

    return this.player;
  }

  // --- Crée les cœurs de vie ---
  createHearts() {
      this.coeurs = [];
      for (let i = 0; i < this.maxVies; i++) {
        const coeur = this.add.sprite(32 + i * 40, 48, "hero_hp", 0).setScrollFactor(0);
        this.coeurs.push(coeur);
      }
  }

  // --- Clavier global ---
  createClavier() {
    this.clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      jump: Phaser.Input.Keyboard.KeyCodes.UP,
      action: Phaser.Input.Keyboard.KeyCodes.I,
      attaque: Phaser.Input.Keyboard.KeyCodes.O
    });
  }

  // --- Déplacement et actions du joueur ---
  updatePlayerMovement() {
    const player = this.player;
    const clavier = this.clavier;

    // Horizontal
    if (clavier.left.isDown) {
      player.setVelocityX(-160);
      if (!player.isAttacking) player.anims.play("anim_tourne_gauche", true);
      player.direction = "gauche";
    } else if (clavier.right.isDown) {
      player.setVelocityX(160);
      if (!player.isAttacking) player.anims.play("anim_tourne_droite", true);
      player.direction = "droite";
    } else {
      player.setVelocityX(0);
      if (!player.isAttacking) player.anims.play("anim_face");
    }

    // Saut
    if (clavier.jump.isDown && player.body.blocked.down) {
      player.setVelocityY(-350);
    }

    // Échelles
    const tile = this.calque_echelles?.getTileAtWorldXY(player.x, player.y, true);
    if (tile && tile.properties.estEchelle) {
      player.setGravityY(0);
      if (clavier.up.isDown) player.setVelocityY(-160);
      else if (clavier.down.isDown) player.setVelocityY(160);
      else player.setVelocityY(0);
    }
  }

  // --- Attaque ---
  handleAttack(targets = null) {
    if (Phaser.Input.Keyboard.JustDown(this.clavier.attaque) && this.player.canAttack) {
      fct.attack(this.player, this, targets);
      this.sonAttaque.play();
    }
  }

  // --- Fragments collectés ---
  createFragmentsText(initialCollected = 0, initialTotal = 9) {
    this.fragmentsText = this.add.text(16, 16, `Fragments : ${initialCollected}/${initialTotal}`, { fontSize: '20px', fill: '#fff' });
    this.fragmentsText.setScrollFactor(0);
  }

  updateFragmentsText(collected, total) {
    if (this.fragmentsText) {
      this.fragmentsText.setText(`Fragments : ${collected}/${total}`);
    }
  }
}
