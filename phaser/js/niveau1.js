import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    // Assets spécifiques
    this.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("carte", "./assets/map.json");
    this.load.spritesheet("img_bandit", "./assets/bandit.png", { frameWidth: 40, frameHeight: 57 });
    this.load.image("img_porte_retour", "./assets/door1.png");
    this.load.image("couteau", "./assets/couteau.png");
  }

  create() {
    // Map
    this.map = this.add.tilemap("carte");
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    this.calque_background2 = this.map.createLayer("calque_background_2", tileset);
    this.calque_background  = this.map.createLayer("calque_background", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);
    this.calque_echelles    = this.map.createLayer("calque_echelles", tileset);

    // Collisions
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Ajuster limites du monde
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Joueur
    this.player = this.physics.add.sprite(100, 600, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.calque_plateformes);

    this.player.canAttack = true;
    this.player.direction = "droite"; // Direction initiale

    // Caméra
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 620, "img_porte_retour");

    // Projectiles
    this.projectiles = this.physics.add.group();
    this.physics.add.collider(this.projectiles, this.calque_plateformes, p => p.destroy());

    // Bandits
    this.bandits = this.physics.add.group();
    const objets = this.map.getObjectLayer("objets")?.objects || [];
    objets.forEach(obj => {
      if (obj.properties?.find(p => p.name === "type")?.value === "bandit") {
        const bandit = this.bandits.create(obj.x, obj.y - 32, "img_bandit");
        bandit.setCollideWorldBounds(true);
        bandit.setBounce(0);
        const vitesse = obj.properties?.find(p => p.name==="direction")?.value==="gauche" ? -80 : 80;
        bandit.setVelocityX(vitesse);
        bandit.setGravityY(300);

        // Sauvegarder direction et temps tir
        bandit.directionInitiale = vitesse;
        bandit.nextShot = 0;
      }
    });
    this.physics.add.collider(this.bandits, this.calque_plateformes);

    // Collision joueur / bandits
    this.physics.add.overlap(this.player, this.bandits, () => {
      this.player.setTint(0xff0000);
      this.physics.pause();
    });

    // Collision joueur / projectiles
    this.physics.add.overlap(this.player, this.projectiles, () => {
      this.player.setTint(0xff0000);
      this.physics.pause();
    });

    // Clavier global
    this.clavier = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.E,
      attaque: Phaser.Input.Keyboard.KeyCodes.F
    });
  }

  // --- Tir de projectile depuis un bandit vers le joueur ---
  launchProjectile(bandit) {
    const projectile = this.projectiles.create(bandit.x, bandit.y, "couteau");

    projectile.body.allowGravity = false;
    projectile.setBounce(0);
    projectile.setCollideWorldBounds(true);

    const angle = Phaser.Math.Angle.Between(bandit.x, bandit.y, this.player.x, this.player.y);
    const vitesseProjectile = 300;

    projectile.setRotation(angle + Math.PI);
    projectile.setVelocity(Math.cos(angle) * vitesseProjectile, Math.sin(angle) * vitesseProjectile);

    // Détruire si touche monde
    projectile.body.onWorldBounds = true;
    projectile.body.world.on("worldbounds", (body) => {
      if (body.gameObject === projectile) projectile.destroy();
    });

    // Détruire si touche plateforme
    this.physics.add.collider(projectile, this.calque_plateformes, () => {
      projectile.destroy();
    });
  }

  // --- Vérifier champ de vision (rayon circulaire) ---
  checkPlayerInSight(bandit) {
    const dx = this.player.x - bandit.x;
    const dy = this.player.y - bandit.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const radius = 300; // rayon de détection

    if (distance < radius) {
      // Joueur en vue → stop et tir
      bandit.setVelocityX(0);

      if (this.time.now > bandit.nextShot) {
        this.launchProjectile(bandit);
        bandit.nextShot = this.time.now + 2000; // 2s cooldown
      }
    } else {
      // Joueur hors de vue → reprend sa patrouille
      if (bandit.body.velocity.x === 0) {
        bandit.setVelocityX(bandit.directionInitiale);
      }
    }
  }

  // --- Vérifie si le bandit arrive au bord de sa plateforme ---
  checkPlatformEdge(bandit) {
    const direction = bandit.body.velocity.x > 0 ? 1 : -1;
    const nextX = bandit.x + direction * (bandit.width / 2 + 1);
    const nextY = bandit.y + bandit.height / 2 + 1;

    const tile = this.calque_plateformes.getTileAtWorldXY(nextX, nextY);

    if (!tile) {
      // Demi-tour
      bandit.setVelocityX(-bandit.body.velocity.x);
      bandit.directionInitiale = bandit.body.velocity.x;
    }
  }

  update() {
    // --- Déplacement joueur ---
    if (!this.player.isAttacking) {
      if (this.clavier.left.isDown) {
        this.player.setVelocityX(-160);
        this.player.anims.play("anim_tourne_gauche", true);
        this.player.direction = "gauche";
      } else if (this.clavier.right.isDown) {
        this.player.setVelocityX(160);
        this.player.anims.play("anim_tourne_droite", true);
        this.player.direction = "droite";
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play("anim_face");
      }
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
    if (this.clavier.jump.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-290);
    }

    // --- Vérification des bandits ---
    this.bandits.children.iterate(bandit => {
      if (bandit) {
        this.checkPlayerInSight(bandit);
        this.checkPlatformEdge(bandit);

        // <<< Nouveau : si bloqué par un mur, demi-tour >>>
        if ((bandit.body.blocked.left || bandit.body.blocked.right) && bandit.body.velocity.x !== 0) {
          bandit.setVelocityX(-bandit.body.velocity.x);
          bandit.directionInitiale = bandit.body.velocity.x;
        }
      }
    });

    // Attaque
    if (this.clavier.attaque.isDown && this.player.canAttack) {
      fct.attack(this.player, this, this.bandits); // <-- passer les ennemis
      this.player.canAttack = false;

      this.time.delayedCall(300, () => { this.player.canAttack = true; });
    }


    // --- Retour au lobby ---
    if (Phaser.Input.Keyboard.JustDown(this.clavier.action) && this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }
}
