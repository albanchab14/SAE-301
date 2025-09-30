import * as fct from "./fonctions.js";

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    // --- GLOBAL PRELOAD ---
    // Joueur
    this.load.spritesheet("img_perso", "./assets/dude.png", { frameWidth: 46, frameHeight: 58 });
    this.load.spritesheet("hero_hp", "./assets/hero_hp.png", { frameWidth: 30, frameHeight: 28 });

    // Clavier
    this.clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,   // Flèche gauche
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT, // Flèche droite
      up: Phaser.Input.Keyboard.KeyCodes.UP,       // Flèche haut
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,   // Flèche bas
      jump: Phaser.Input.Keyboard.KeyCodes.UP,     // Même que flèche haut
      action: Phaser.Input.Keyboard.KeyCodes.I,    // I au lieu de E
      attaque: Phaser.Input.Keyboard.KeyCodes.O    // O au lieu de F
    });

    // Maps & portes du lobby
    this.load.image("selection_tileset", "./assets/selectionJeu.png");
    this.load.tilemapTiledJSON("map_selection", "./assets/map_selection.json");
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");

    // Hitbox invisible de l'attaque
    this.load.image("attack_hitbox", "./assets/attack_hitbox.png");

    this.load.spritesheet("img_perso_attack", "./assets/dude_attack.png", { frameWidth: 64, frameHeight: 57 });

  }

  create() {
    // --- ANIMATIONS GLOBALES ---
    if (!this.animsGlobalCreated) {
      this.anims.create({
        key: "anim_tourne_gauche",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
      this.anims.create({
        key: "anim_tourne_droite",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
        frameRate: 8,
        repeat: -1
      });
      this.anims.create({
        key: "anim_face",
        frames: [{ key: "img_perso", frame: 4 }],
        frameRate: 20
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

      this.animsGlobalCreated = true;
    }

    // --- MAP LOBBY ---
    this.map = this.add.tilemap("map_selection");
    const tileset = this.map.addTilesetImage("selection_tileset", "selection_tileset");

    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

    // Collision plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Ajuster les limites du monde
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Portes
    this.porte1 = this.physics.add.staticSprite(100, 601, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(640, 597, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(1150, 595, "img_porte3");

    // Joueur
    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.calque_plateformes);
    
    this.player.canAttack = true;
    this.player.direction = "droite"; // Direction initiale
    
    // Valeur conservée ou valeur max par défaut
    this.maxVies = 5;
    this.game.config.pointsDeVie = 5

    // Création des cœurs
    this.coeurs = [];
    for (let i = 0; i < this.maxVies; i++) {
      let coeur = this.add.sprite(32 + i*40, 48, "hero_hp", 0).setScrollFactor(0);
      this.coeurs.push(coeur);
    }
    fct.updateHearts(this);


    // Caméra
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    
    
  }

  update() {
    fct.updateHearts(this);

    // --- Déplacement horizontal ---
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
    
    // --- Saut ---
    if (this.clavier.jump.isDown && this.player.body.blocked.down) this.player.setVelocityY(-320);


    // --- Attaque ---
    if (Phaser.Input.Keyboard.JustDown(this.clavier.attaque) && this.player.canAttack) {
      fct.attack(this.player, this);
    }



    // --- Portes vers les niveaux ---
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action)) {
      

      if (this.physics.overlap(this.player, this.porte1)) {
        console.log("Vie lue dans registry:", this.game.config.pointsDeVie);
        this.registry.set('playerVie', this.game.config.pointsDeVie);
        this.scene.switch("niveau1");
      }
      if (this.physics.overlap(this.player, this.porte2)) this.scene.switch("niveau2");
      if (this.physics.overlap(this.player, this.porte3)) this.scene.switch("niveau3");
    }
  }
}
