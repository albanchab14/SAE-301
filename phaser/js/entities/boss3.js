// entities/boss3.js
import Enemy from "./enemy.js";
import Bat from "./bat.js";
import * as fct from "../fonctions.js";

export default class Boss3 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss3");

    // --- VIE ---
    this.maxVie = 5;
    this.vie = this.maxVie;

    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;

    this.state = "idle"; 
    this.phase = 1;
    this.combatStarted = false;
    this.hasDroppedCrystal = false;

    this.spots = [
      { x: 3700, y: 1209 },
      { x: 4239, y: 1337 },
      { x: 3156, y: 1337 }
    ];

    this.lastAction = 0;
    this.actionCooldown = 2500;

    this.batsGroup = scene.add.group();

    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    // --- BARRE DE VIE ---
    this.lifeBar = scene.add.graphics();
    this.lifeBar.setDepth(10);
    this.updateLifeBar();

    this.play("boss3_idle_right");
  }

  updateLifeBar() {
    if (!this.lifeBar) return;
    const barWidth = 80;
    const barHeight = 10;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height - 30;

    this.lifeBar.clear();
    this.lifeBar.fillStyle(0x333333, 1);
    this.lifeBar.fillRect(x, y, barWidth, barHeight);

    const percent = Math.max(this.vie / this.maxVie, 0);
    const color = percent > 0.5 ? 0x06c80f : (percent > 0.2 ? 0xf8c200 : 0xdb222a);
    this.lifeBar.fillStyle(color, 1);
    this.lifeBar.fillRect(x, y, barWidth * percent, barHeight);
  }

  takeDamage(amount = 1) {
    this.vie = Math.max(0, this.vie - amount);
    this.updateLifeBar();
    if (this.vie <= 0) this.destroy();
  }

  update(player, projectilesGroup) {
    if (!this.body || !player || this.vie <= 0) return;

    this.projectilesGroup = projectilesGroup;
    this.alert.setPosition(this.x, this.y - this.height);
    this.updateLifeBar();

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // 🔹 Début du combat
    if (!this.combatStarted && distance < 400 && this.hasLineOfSightTo(player, this.scene.calque_plateformes)) {
      this.combatStarted = true;
      this.state = "active";
    }

    if (!this.combatStarted) {
      this.playIdle();
      return;
    }

    this.updatePhase();
    const now = this.scene.time.now;

    if (this.state === "alert") {
      this.playIdle();
      return;
    }

    // Attente entre actions
    if (now - this.lastAction >= this.actionCooldown) {
      this.lastAction = now;

      let actions = [];
      if (this.phase === 1) actions = ["teleport", "shoot", "spawnBat"];
      else if (this.phase === 2) actions = ["teleport", "shoot", "spawnBat"];
      else actions = ["teleport", "shoot", "spawnBats"];

      const choice = Phaser.Utils.Array.GetRandom(actions);

      // Vérification de ligne de vue avant toute action offensive
      if ((choice === "shoot" || choice === "spawnBat" || choice === "spawnBats") &&
          !this.hasLineOfSightTo(player, this.scene.calque_plateformes)) {
        this.state = "idle";
        return;
      }

      if (choice === "teleport") this.preAction(() => this.teleportToNextSpot());
      else if (choice === "shoot") this.preAction(() => {
        this.state = "shoot";
        this.shootProjectile(player);
      });
      else if (choice === "spawnBat") this.preAction(() => {
        this.state = "shoot";
        this.spawnBats(player, 1);
      });
      else if (choice === "spawnBats") this.preAction(() => {
        this.state = "shoot";
        this.spawnBats(player, 2);
      });
    }

    // Mettre à jour la direction en fonction de la position du joueur
    if (player) {
        this.direction = player.x < this.x ? -1 : 1;
        this.setFlipX(this.direction === -1);
    }

    // Animations selon l'état
    if (this.state === "idle" || this.state === "alert") this.playIdle();
    else if (this.state === "shoot") this.playAttack();
  }

  playIdle() {
    // Utiliser toujours l'animation droite et flipper le sprite si nécessaire
    this.anims.play("boss3_idle_right", true);
    this.state = "idle";
  }

  playAttack() {
    // Utiliser toujours l'animation droite et flipper le sprite si nécessaire
    this.anims.play("boss3_attack_right", true);
  }

  updatePhase() {
    const hpPercent = this.vie / this.maxVie;
    if (hpPercent > 0.7) this.phase = 1;
    else if (hpPercent > 0.4) this.phase = 2;
    else this.phase = 3;
  }

  preAction(callback) {
    if (this.state === "alert") return;
    this.state = "alert";
    this.alert.setVisible(true);

    this.scene.time.delayedCall(600, () => {
      if (!this.body) return;
      this.alert.setVisible(false);
      this.state = "active";
      callback.call(this); // corrige le "this" du callback
    });
  }


  teleportToNextSpot() {
    const currentIndex = this.spots.findIndex(s => s.x === this.x && s.y === this.y);
    let nextIndex;
    do { nextIndex = Phaser.Math.Between(0, this.spots.length - 1); } 
    while (nextIndex === currentIndex);

    const nextSpot = this.spots[nextIndex];
    this.setPosition(nextSpot.x, nextSpot.y);

    const puff = this.scene.add.particles(this.x, this.y, "img_bat", {
      speed: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 8
    });
    this.scene.time.delayedCall(400, () => puff.destroy());

    this.scene.tweens.add({ targets: this, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  spawnBats(player = this.scene.player, count = 1) {
    console.log("🦇 Spawn de chauve-souris demandé :", count);

    // Vérification des arguments
    if (!player || typeof count !== "number" || count <= 0) {
      console.warn("spawnBats appelé avec des paramètres invalides :", { player, count });
      return;
    }

    const positions = [-100, -50, 50, 100]; // positions horizontales autour du boss

    for (let i = 0; i < count; i++) {
      const batX = this.x + positions[i % positions.length];
      const batY = this.y - 50;

      console.log(`→ Création bat à (${batX}, ${batY})`);

      // Création de la chauve-souris
      const bat = new Bat(this.scene, batX, batY);

      // Ajout au groupe d'ennemis du niveau
      this.scene.enemies.add(bat);

      // Ajout de la collision physique avec les plateformes
      this.scene.physics.add.collider(bat, this.scene.calque_plateformes);

      // Activation du comportement et effet d'apparition
      bat.state = "patrol";
      bat.setAlpha(0);
      this.scene.tweens.add({
        targets: bat,
        alpha: { from: 0, to: 1 },
        duration: 300,
        ease: "Sine.easeIn"
      });
    }

    // Fin de l'action après le délai de spawn
    this.scene.time.delayedCall(500, () => {
      this.state = "idle";
    });
  }


  shootProjectile(player) {
    if (!player || !this.scene) return;

    // Mettre à jour la direction avant de tirer
    this.direction = player.x < this.x ? -1 : 1;
    this.setFlipX(this.direction === -1);

    const projectile = this.scene.physics.add.sprite(this.x, this.y, "dark_projectile");
    this.projectilesGroup.add(projectile);
    projectile.body.setAllowGravity(false);
    projectile.setCollideWorldBounds(false);

    const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, player.x, player.y);
    const speed = this.phase === 3 ? 300 : 220;

    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    projectile.setRotation(angle);

    const width = 43, height = 14;
    const rotatedWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
    const rotatedHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
    projectile.body.setSize(rotatedWidth, rotatedHeight);
    projectile.body.setOffset((width - rotatedWidth)/2, (height - rotatedHeight)/2);

    this.scene.physics.add.overlap(projectile, player, () => {
      if (!projectile.active) return;
      projectile.destroy();
      fct.lifeManager.retirerPV(this.scene, 1);
      console.log("Le joueur est touché par un projectile !");
    });

    this.scene.time.delayedCall(500, () => this.state = "idle");
    this.scene.time.delayedCall(5000, () => { if (projectile.active) projectile.destroy(); });

    console.log("Projectile tiré !");
  }

  dropItem() {
    if (this.hasDroppedCrystal) return;
    this.hasDroppedCrystal = true;

    const scene = this.scene;
    const cristal = scene.physics.add.sprite(this.x, this.y, "cristal_violet");
    cristal.setBounce(0.2);
    cristal.setCollideWorldBounds(true);
    scene.physics.add.collider(cristal, scene.calque_plateformes);

    scene.physics.add.overlap(scene.player, cristal, () => {
      fct.lifeManager.heal(scene, scene.maxVies);
      if (!scene.game.config.crystals) scene.game.config.crystals = {};
      scene.game.config.crystals.violet = true;
      console.log("Cristal violet récupéré !");
      if (scene.sonCristal) scene.sonCristal.play({ volume: 1 });
      cristal.destroy();
    });
  }

  destroy(fromScene) {
    if (this.activeTimers) this.activeTimers.forEach(t => t.remove(false));
    if (this.alert) this.alert.destroy();
    
     if (this.lifeBar) {
        this.lifeBar.destroy();
        this.lifeBar = null;
    }

    if (this.scene && this.scene.porte_retour_boss?.body) {
      this.scene.porte_retour_boss.setVisible(true);
      this.scene.porte_retour_boss.body.enable = true;
    }

    if (this.bossMusic) {
      if (this.bossMusic.isPlaying) this.bossMusic.stop();
      this.bossMusic.destroy();
      this.bossMusic = null;
    }

    if (this.scene && this.scene.mapMusic) this.scene.mapMusic.resume();

    this.boss3Alive = false;
    this.dropItem();
    super.destroy(fromScene);
  }
}