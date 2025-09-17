import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier

// définition de la classe "selection"
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" }); // mettre le meme nom que le nom de la classe
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    this.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("carte", "./assets/map.json");
    this.load.spritesheet("img_perso", "./assets/dude.png", {
      frameWidth: 53,
      frameHeight: 58
    });
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    // chargement carte
    this.map = this.add.tilemap("carte"); // ✅ on stocke la carte dans this.map
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");

    // calques
    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset); // ✅ stocké dans this

    // portes
    this.porte1 = this.physics.add.staticSprite(100, 620, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(50, 620, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(150, 620, "img_porte3");

    // joueur
    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setCollideWorldBounds(true);
    player.body.onWorldBounds = true;
    player.body.world.on(
      "worldbounds",
      function (body, up, down) {
        if (body.gameObject === player && down == true) {
          this.physics.pause();
          player.setTint(0xff0000);
        }
      },
      this
    ); 
    player.setBounce(0.2);
    
    // collisions plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.physics.add.collider(player, this.calque_plateformes);

    // monde & caméra
    this.physics.world.setBounds(0, 0, 6400, 1920);
    this.cameras.main.setBounds(0, 0, 6400, 1920);
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(1.2);

    // animations
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

    // clavier
    clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
    });
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    if (clavier.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("anim_tourne_droite", true);
    } else {
      player.setVelocityX(0);
      player.anims.play("anim_face");
    }

    if (clavier.jump.isDown && player.body.blocked.down) {
      player.setVelocityY(-290);
    }

    if (Phaser.Input.Keyboard.JustDown(clavier.jump)) {
      if (this.physics.overlap(player, this.porte1)) this.scene.switch("niveau1");
      if (this.physics.overlap(player, this.porte2)) this.scene.switch("niveau2");
      if (this.physics.overlap(player, this.porte3)) this.scene.switch("niveau3");
    }

    /*************************
     * gestion des échelles  *
     *************************/
    const tile = this.calque_echelles.getTileAtWorldXY(player.x, player.y, true); // ✅ utilise le calque stocké

    if (tile && tile.properties.estEchelle) {
      player.setGravityY(0);
      if (clavier.up.isDown) {
        player.setVelocityY(-160);
      } else if (clavier.down.isDown) {
        player.setVelocityY(160);
      } else {
        player.setVelocityY(0);
      }
    }
  }
}
