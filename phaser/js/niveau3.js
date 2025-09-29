import * as fct from "./fonctions.js";

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    // Assets spécifiques
    this.load.image("Phaser_tuilesdejeu3", "./assets/selectionJeu.png"); // Penser à modifier si tileset différent
    this.load.tilemapTiledJSON("carte3", "./assets/map3.json");
    this.load.spritesheet("img_bandit", "./assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    this.load.image("img_porte_retour", "./assets/door1.png");
    this.load.image("couteau", "./assets/couteau.png");
  }

  create() {
    // Map
    this.map = this.add.tilemap("carte3");
    const tileset = this.map.addTilesetImage("map3_tileset", "Phaser_tuilesdejeu3");
    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

    // Collision plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 595, "img_porte_retour");
    
    // Joueur
    this.player = this.physics.add.sprite(100, 600, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Bandits
    this.bandits = this.physics.add.group();
    const objets = this.map.getObjectLayer("objets")?.objects || [];
    objets.forEach(obj => {
      const typeProp = obj.properties?.find(p => p.name === "type")?.value;
      if(typeProp === "bandit") {
        const bandit = this.bandits.create(obj.x, obj.y - 32, "img_bandit");
        bandit.setCollideWorldBounds(true);
        bandit.setBounce(1,0);
        const vitesse = obj.properties?.find(p => p.name==="direction")?.value==="gauche"? -80:80;
        bandit.setVelocityX(vitesse);
        bandit.setGravityY(300);
      }
    });
    this.physics.add.collider(this.bandits, this.calque_plateformes);
    this.physics.add.overlap(this.player, this.bandits, () => {
      this.player.setTint(0xff0000);
      this.physics.pause();
      this.scene.start("defaite");
    });

    // Projectiles
    this.projectiles = this.physics.add.group();
    this.physics.add.collider(this.projectiles, this.calque_plateformes, p => p.destroy());

    // Clavier 
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

    // Saut
    if (this.clavier.jump.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-320);
    }

    // Retour vers la sélection avec E
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
        this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }
}
