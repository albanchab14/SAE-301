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
    this.map = this.add.tilemap("carte2");
    const tileset = this.map.addTilesetImage("map2_tileset", "Phaser_tuilesdejeu2");
    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

    // Collision plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Joueur (réutilisation global préchargé)
    this.player = this.physics.add.sprite(100, 600, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.calque_plateformes);

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 620, "img_porte_retour");

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
    });

    // Projectiles
    this.projectiles = this.physics.add.group();
    this.physics.add.collider(this.projectiles, this.calque_plateformes, p => p.destroy());
    
    // --- Clavier global (réutiliser comme dans selection.js)
    this.clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.E  // <-- touche pour interagir
    });
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

    // Saut
    if (this.clavier.jump.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-290);
    }

    // Retour vers la sélection avec E
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) &&
        this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }
}
