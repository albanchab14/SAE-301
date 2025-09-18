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
    this.load.spritesheet("img_bandit", "./assets/bandit.png", {
      frameWidth: 40,
      frameHeight: 57
    });
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");

    this.load.image("couteau", "./assets/couteau.png");
  }

/************************************************************************/
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
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

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
    
    // Groupe des bandits
    this.bandits = this.physics.add.group();

    // Récupère les objets depuis le calque "objets"
    const objets = this.map.getObjectLayer("objets")?.objects || [];
    objets.forEach(obj => {
      // Cherche la propriété personnalisée "type"
      const typeProp = obj.properties?.find(p => p.name === "type")?.value;

      if (typeProp === "bandit") {
        // Crée un sprite bandit à la position de l'objet
        // Ajuste la Y si nécessaire selon la hauteur du sprite
        const bandit = this.bandits.create(obj.x, obj.y - 32, "img_bandit");

        bandit.setCollideWorldBounds(true);
        bandit.setBounce(1, 0);
        const vitesseBandit = 80; // Vitesse de déplacement du bandit
        bandit.setVelocityX(obj.properties?.find(p => p.name === "direction")?.value === "gauche" ? -vitesseBandit : vitesseBandit); // direction initiale
        bandit.setGravityY(300);
      }
    });

    // Collision bandits/plateformes
    this.physics.add.collider(this.bandits, this.calque_plateformes);

    // Collision joueur/bandits
    this.physics.add.overlap(player, this.bandits, (player, bandit) => {
      // Ici tu peux gérer la réaction (ex: perdre une vie, recommencer, etc.)
      player.setTint(0xff0000);
      this.physics.pause();
    }, null, this);

    // Animations des bandits
    this.anims.create({
        key: "bandit_gauche",
        frames: this.anims.generateFrameNumbers("img_bandit", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
    });
    this.anims.create({
        key: "bandit_droite",
        frames: this.anims.generateFrameNumbers("img_bandit", { start: 4, end: 7 }),
        frameRate: 6,
        repeat: -1
    });

    // COUTEAUX
    this.projectiles = this.physics.add.group();

    // Collision projectiles / plateformes
    this.physics.add.collider(this.projectiles, this.calque_plateformes, (proj) => {
        proj.destroy();
    });

    // Collision projectiles / joueur
    this.physics.add.overlap(player, this.projectiles, (player, proj) => {
        player.setTint(0xff0000);
        this.physics.pause();
        proj.destroy();
    });

    // Fonction pour tirer un projectile
    this.launchProjectile = (bandit) => {
      const projectile = this.projectiles.create(bandit.x, bandit.y, 'couteau');

      projectile.body.allowGravity = false;
      projectile.setBounce(0);
      projectile.setCollideWorldBounds(true);

      const angle = Phaser.Math.Angle.Between(bandit.x, bandit.y, player.x, player.y);
      const vitesseProjectile = 300;

      // Rotation corrigée
      projectile.setRotation(angle + Math.PI);

      projectile.setVelocity(
          Math.cos(angle) * vitesseProjectile,
          Math.sin(angle) * vitesseProjectile
      );

      projectile.body.onWorldBounds = true;
      projectile.body.world.on('worldbounds', (body) => {
          if (body.gameObject === projectile) projectile.destroy();
      });

      this.physics.add.collider(projectile, this.calque_plateformes, () => {
          projectile.destroy();
      });
    };



    // On lance l'animation initiale selon la vélocité X
    this.bandits.getChildren().forEach(bandit => {
        if (bandit.body.velocity.x < 0) {
            bandit.anims.play("bandit_gauche", true);
        } else {
            bandit.anims.play("bandit_droite", true);
        }
    });

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

    // ANIMATIONS BANDITS (non fonctionnelles pour l'instant)
    this.anims.create({
      key: "bandit_gauche",
      frames: this.anims.generateFrameNumbers("img_bandit", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "bandit_droite",
      frames: this.anims.generateFrameNumbers("img_bandit", { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
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

    // Mise à jour animation des bandits selon direction
    this.bandits.getChildren().forEach(bandit => {
        if (bandit.body.velocity.x < 0) {
            bandit.anims.play("bandit_gauche", true);
        } else if (bandit.body.velocity.x > 0) {
            bandit.anims.play("bandit_droite", true);
        }
    });

    // PATROLd + ATTAQUE BANDITS
    // Mise à jour des bandits : patrol + attaque + détection bord
    this.bandits.getChildren().forEach(bandit => {
        const distance = Phaser.Math.Distance.Between(bandit.x, bandit.y, player.x, player.y);

        if(distance < 250) {
            // Mode attaque
            bandit.isAttacking = true;
            bandit.setVelocityX(0);

            if(!bandit.lastShot || this.time.now - bandit.lastShot > 2000) {
                this.launchProjectile(bandit);
                bandit.lastShot = this.time.now;
            }
        } else {
            // Mode patrol
            if(bandit.isAttacking) bandit.isAttacking = false;

            // Vérifie la tuile juste devant pour ne pas tomber
            const frontX = bandit.body.velocity.x > 0 ? bandit.x + bandit.width/2 + 1 : bandit.x - bandit.width/2 - 1;
            const frontY = bandit.y + bandit.height/2 + 1;
            const tile = this.calque_plateformes.getTileAtWorldXY(frontX, frontY);

            // Si pas de sol devant ou collision avec le bord
            if(!tile || bandit.body.blocked.left || bandit.body.blocked.right) {
                bandit.setVelocityX(-bandit.body.velocity.x || 80); // inverse la direction
            }

            // Si aucune vitesse, attribue la vitesse par défaut
            if(bandit.body.velocity.x === 0) bandit.setVelocityX(80);
        }

        // Animation selon direction
        if(bandit.body.velocity.x < 0) bandit.anims.play('bandit_gauche', true);
        else if(bandit.body.velocity.x > 0) bandit.anims.play('bandit_droite', true);
    });



  }
}
