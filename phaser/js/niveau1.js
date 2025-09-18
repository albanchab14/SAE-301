import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Assets du niveau
    this.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("carte", "./assets/map.json");
    this.load.spritesheet("img_perso", "./assets/dude.png", { frameWidth: 53, frameHeight: 58 });
    this.load.spritesheet("img_bandit", "./assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    // Porte retour vers le lobby
    this.load.image("img_porte_retour", "./assets/door1.png");

    this.load.image("couteau", "./assets/couteau.png");
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    // Carte & tileset
    this.map = this.add.tilemap("carte");
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");

    // Calques
    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 620, "img_porte_retour");

    // Joueur
    player = this.physics.add.sprite(100, 600, "img_perso");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Collision joueur/plateformes
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.physics.add.collider(player, this.calque_plateformes);

    // Groupe des bandits
    this.bandits = this.physics.add.group();

    // Crée les bandits depuis le calque "objets"
    const objets = this.map.getObjectLayer("objets")?.objects || [];
    objets.forEach(obj => {
      const typeProp = obj.properties?.find(p => p.name === "type")?.value;
      if (typeProp === "bandit") {
        const bandit = this.bandits.create(obj.x, obj.y - 32, "img_bandit");
        bandit.setCollideWorldBounds(true);
        bandit.setBounce(1, 0);
        const vitesseBandit = 80;
        bandit.setVelocityX(obj.properties?.find(p => p.name === "direction")?.value === "gauche" ? -vitesseBandit : vitesseBandit);
        bandit.setGravityY(300);
      }
    });

    // Collision bandits/plateformes
    this.physics.add.collider(this.bandits, this.calque_plateformes);

    // Collision joueur/bandits
    this.physics.add.overlap(player, this.bandits, (player, bandit) => {
      player.setTint(0xff0000);
      this.physics.pause();
    });

    // Animations joueur
    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 4 }], frameRate: 20 });

    // Animations bandits
    this.anims.create({ key: "bandit_gauche", frames: this.anims.generateFrameNumbers("img_bandit", { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: "bandit_droite", frames: this.anims.generateFrameNumbers("img_bandit", { start: 4, end: 7 }), frameRate: 6, repeat: -1 });

    // Clavier
    clavier = this.input.keyboard.addKeys({ left: Phaser.Input.Keyboard.KeyCodes.Q, right: Phaser.Input.Keyboard.KeyCodes.D, jump: Phaser.Input.Keyboard.KeyCodes.SPACE, down: Phaser.Input.Keyboard.KeyCodes.S, up: Phaser.Input.Keyboard.KeyCodes.Z });

    // Projectiles
    this.projectiles = this.physics.add.group();
    this.physics.add.collider(this.projectiles, this.calque_plateformes, (proj) => proj.destroy());
    this.physics.add.overlap(player, this.projectiles, (player, proj) => {
      player.setTint(0xff0000);
      this.physics.pause();
      proj.destroy();
    });

    // Caméra
    this.physics.world.setBounds(0, 0, 6400, 1920);
    this.cameras.main.setBounds(0, 0, 6400, 1920);
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(1.2);

    // Fonction pour lancer un projectile
    this.launchProjectile = (bandit) => {
      const projectile = this.projectiles.create(bandit.x, bandit.y, 'couteau');
      projectile.body.allowGravity = false;
      projectile.setBounce(0);
      projectile.setCollideWorldBounds(true);
      const angle = Phaser.Math.Angle.Between(bandit.x, bandit.y, player.x, player.y);
      const vitesseProjectile = 300;
      projectile.setRotation(angle + Math.PI);
      projectile.setVelocity(Math.cos(angle) * vitesseProjectile, Math.sin(angle) * vitesseProjectile);
      projectile.body.onWorldBounds = true;
      projectile.body.world.on('worldbounds', (body) => { if(body.gameObject === projectile) projectile.destroy(); });
      this.physics.add.collider(projectile, this.calque_plateformes, () => projectile.destroy());
    };
  }

  update() {
    // Déplacement joueur
    if (clavier.left.isDown) { player.setVelocityX(-160); player.anims.play("anim_tourne_gauche", true); }
    else if (clavier.right.isDown) { player.setVelocityX(160); player.anims.play("anim_tourne_droite", true); }
    else { player.setVelocityX(0); player.anims.play("anim_face"); }

    if (clavier.jump.isDown && player.body.blocked.down) player.setVelocityY(-290);

    // Porte retour vers le lobby
    if (Phaser.Input.Keyboard.JustDown(clavier.jump)) {
      if (this.physics.overlap(player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }

    // Gestion des échelles
    const tile = this.calque_echelles.getTileAtWorldXY(player.x, player.y, true);
    if(tile && tile.properties.estEchelle) {
      player.setGravityY(0);
      if(clavier.up.isDown) {
        player.setVelocityY(-160);
      }
      else if(clavier.down.isDown) {
        player.setVelocityY(160);
      }
      else player.setVelocityY(0);
    }

    // Mise à jour animation des bandits
    this.bandits.getChildren().forEach(bandit => {
      if(bandit.body.velocity.x < 0) bandit.anims.play('bandit_gauche', true);
      else if(bandit.body.velocity.x > 0) bandit.anims.play('bandit_droite', true);
    });

    // Patrol et attaque des bandits
    this.bandits.getChildren().forEach(bandit => {
      const distance = Phaser.Math.Distance.Between(bandit.x, bandit.y, player.x, player.y);
      if(distance < 250) {
        bandit.isAttacking = true;
        bandit.setVelocityX(0);
        if(!bandit.lastShot || this.time.now - bandit.lastShot > 2000) {
          this.launchProjectile(bandit);
          bandit.lastShot = this.time.now;
        }
      } else {
        if(bandit.isAttacking) bandit.isAttacking = false;
        const frontX = bandit.body.velocity.x > 0 ? bandit.x + bandit.width/2 + 1 : bandit.x - bandit.width/2 - 1;
        const frontY = bandit.y + bandit.height/2 + 1;
        const tile = this.calque_plateformes.getTileAtWorldXY(frontX, frontY);
        if(!tile || bandit.body.blocked.left || bandit.body.blocked.right) bandit.setVelocityX(-bandit.body.velocity.x || 80);
        if(bandit.body.velocity.x === 0) bandit.setVelocityX(80);
      }
    });
  }
}
