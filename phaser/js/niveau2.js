import * as fct from "./fonctions.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    // Assets spécifiques
    this.load.image("Phaser_tuilesdejeu2", "./assets/selectionJeu.png"); // Penser à modifier si tileset différent
    this.load.tilemapTiledJSON("carte2", "./assets/map2.json");
    this.load.spritesheet("img_bandit", "./assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    this.load.image("img_porte_retour", "./assets/door1.png");
    this.load.image("couteau", "./assets/couteau.png");
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
    this.porte_retour = this.physics.add.staticSprite(100, 597, "img_porte_retour");
    
    // Joueur
    this.player = this.physics.add.sprite(100, 600, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.calque_plateformes);
    
    this.player.canAttack = true;
    this.player.direction = "droite"; // Direction initiale
    
    // Vies joueur
    this.maxVies = 5;
    this.coeurs = [];
    for (let i = 0; i < this.maxVies; i++) {
      let coeur = this.add.sprite(32 + i*40, 48, "hero_hp", 0).setScrollFactor(0);
      this.coeurs.push(coeur);
    }
    // Mise à jour initiale des cœurs
    fct.updateHearts(this);

    // Camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map2.widthInPixels, this.map2.heightInPixels);

    // --- Clavier global (réutiliser comme dans selection.js)
    this.clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,   // Flèche gauche
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT, // Flèche droite
      up: Phaser.Input.Keyboard.KeyCodes.UP,       // Flèche haut
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,   // Flèche bas
      jump: Phaser.Input.Keyboard.KeyCodes.UP,     // Même que flèche haut
      action: Phaser.Input.Keyboard.KeyCodes.I,    // I au lieu de E
      attaque: Phaser.Input.Keyboard.KeyCodes.O    // O au lieu de F
    });
  }

  update() {
    // Déplacement horizontal
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      if (!this.player.isAttacking) this.player.anims.play("anim_tourne_gauche", true);
      this.player.direction = "gauche";
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      if (!this.player.isAttacking) this.player.anims.play("anim_tourne_droite", true);
      this.player.direction = "droite";
    } else {
      this.player.setVelocityX(0);
      if (!this.player.isAttacking) this.player.anims.play("anim_face");
    }

    // --- Gestion échelles ---
    const tile = this.calque_echelles.getTileAtWorldXY(this.player.x, this.player.y, true);
    if (tile && tile.properties.estEchelle) {
      this.player.setGravityY(0);
      if (this.clavier.up.isDown) this.player.setVelocityY(-160);
      else if (this.clavier.down.isDown) this.player.setVelocityY(160);
      else this.player.setVelocityY(0);
    }
    
    // Saut
    if (this.clavier.jump.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-320);
    }

    // Attaque
    if (this.clavier.attaque.isDown && this.player.canAttack) {
      fct.attack(this.player, this, this.enemies);
      this.player.canAttack = false;
      this.time.delayedCall(300, () => { this.player.canAttack = true; });
    }
    
    // Retour vers la sélection avec I
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
        this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }
}
