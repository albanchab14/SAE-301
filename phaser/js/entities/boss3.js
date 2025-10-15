// entities/boss3.js
import Enemy from "./enemy.js";
import Bat from "./bat.js";
import * as fct from "../fonctions.js";

export default class Boss3 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss3");

    this.vie = 1;
    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;

    this.state = "idle"; // idle / active / mort
    this.phase = 1;
    this.combatStarted = false;

    // Spots fixes pour téléportation
    this.spots = [
      { x: 3700, y: 1209 },
      { x: 4239, y: 1337 },
      { x: 3156, y: 1337 }
    ];

    // Timers
    this.lastAction = 0;
    this.actionCooldown = 2500; // cooldown général entre actions

    this.batsGroup = scene.add.group();

    // Texte "!" pour avertissement
    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    this.play("boss3_idle_right");
  }

  update(player, projectilesGroup) {
    this.projectilesGroup = projectilesGroup;
    if (!this.body || !player || this.vie <= 0) return;
    this.alert.setPosition(this.x, this.y - this.height);

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (!this.combatStarted && distance < 400 && this.hasLineOfSightTo(player, this.scene.calque_plateformes)) {
      this.combatStarted = true;
      this.state = "active";
    }

    if (!this.combatStarted) {
      this.play("boss3_idle_right", true);
      return;
    }

    this.updatePhase();

    const now = this.scene.time.now;

    // ⚡ Garde-fou : si une alerte est active, on ne fait rien
    if (this.state === "alert") return;

    // Attente entre actions
    if (now - this.lastAction < this.actionCooldown) return;

    this.lastAction = now;

    // Choix de l'action selon la phase
    let actions = [];
    if (this.phase === 1) {
      actions = ["teleport", "shoot"];
    } else if (this.phase === 2) {
      actions = ["teleport", "shoot", "spawnBat"];
    } else if (this.phase === 3) {
      actions = ["teleport", "shoot", "spawnBats"];
    }

    // Choisit une action au hasard
    const choice = Phaser.Utils.Array.GetRandom(actions);

    // Lance l’action avec "!"
    if (choice === "teleport") this.preAction(() => this.teleportToNextSpot());
    else if (choice === "shoot") this.preAction(() => this.shootProjectile(player));
    else if (choice === "spawnBat") this.preAction(() => this.spawnBats(player, 1));
    else if (choice === "spawnBats") this.preAction(() => this.spawnBats(player, 2));
  }

  updatePhase() {
    const hpPercent = this.vie / 10;
    if (hpPercent > 0.7) this.phase = 1;
    else if (hpPercent > 0.4) this.phase = 2;
    else this.phase = 3;
  }

  preAction(callback) {
    if (this.state === "alert") return;
    this.state = "alert";
    this.alert.setVisible(true);

    this.scene.time.delayedCall(600, () => { // 600 ms d’avertissement
      if (!this.body) return;
      this.alert.setVisible(false);
      this.state = "active";
      callback();
    });
  }

  teleportToNextSpot() {
    const currentIndex = this.spots.findIndex(s => s.x === this.x && s.y === this.y);
    let nextIndex;
    do {
      nextIndex = Phaser.Math.Between(0, this.spots.length - 1);
    } while (nextIndex === currentIndex);

    const nextSpot = this.spots[nextIndex];
    this.setPosition(nextSpot.x, nextSpot.y);
    this.baseY = nextSpot.y;

    const puff = this.scene.add.particles(this.x, this.y, "img_bat", {
      speed: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 8
    });
    this.scene.time.delayedCall(400, () => puff.destroy());

    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0, to: 1 },
      duration: 300,
    });
  }

  spawnBats(player, count = 1) {
    const activeBats = this.scene.enemies.getChildren().filter(e => e instanceof Bat).length;
    if (activeBats >= 6) return;

    const spacing = 40;

    for (let i = 0; i < count; i++) {
      const offsetX = (i - (count - 1) / 2) * spacing;
      const batX = this.x + offsetX;
      const batY = this.y - 60;

      const bat = new Bat(this.scene, batX, batY);
      this.scene.enemies.add(bat);
      bat.state = "patrol";

      bat.setAlpha(0);
      this.scene.tweens.add({
        targets: bat,
        alpha: { from: 0, to: 1 },
        duration: 300
      });
    }
  }

  shootProjectile(player) {
    if (!player || !this.scene) return;

    const projectile = this.scene.physics.add.sprite(this.x, this.y, "dark_projectile");
    this.projectilesGroup.add(projectile);
    projectile.body.setAllowGravity(false);
    projectile.setCollideWorldBounds(false);

    const dx = player.x - projectile.x;
    const dy = player.y - projectile.y;
    const angle = Math.atan2(dy, dx);

    const speed = this.phase === 3 ? 300 : 220;
    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    projectile.setRotation(angle);

    const width = 43;
    const height = 14;
    const rotatedWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
    const rotatedHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
    projectile.body.setSize(rotatedWidth, rotatedHeight);
    projectile.body.setOffset((width - rotatedWidth) / 2, (height - rotatedHeight) / 2);

    this.scene.physics.add.overlap(projectile, player, () => {
      if (!projectile.active) return;
      projectile.destroy();
      fct.lifeManager.retirerPV(this.scene, 1);
      console.log("💥 Le joueur est touché par un projectile !");
    });

    this.scene.time.delayedCall(5000, () => {
      if (projectile.active) projectile.destroy();
    });

    console.log("🔮 Projectile tiré !");
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
      console.log ("💎 Cristal violet récupéré !");
      if (scene.sonCristal) scene.sonCristal.play({ volume: 1 });
      cristal.destroy();
    });
  }

  destroy(fromScene) {
    if (this.activeTimers) {
      this.activeTimers.forEach(t => t.remove(false));
      this.activeTimers = [];
    }

    if (this.alert) this.alert.destroy();
    this.dropItem();

    if (this.scene && this.scene.porte_retour_boss?.body) {
      this.scene.porte_retour_boss.setVisible(true);
      this.scene.porte_retour_boss.body.enable = true;
    }

    if (this.bossMusic) {
      if (this.bossMusic.isPlaying) this.bossMusic.stop();
      this.bossMusic.destroy();
      this.bossMusic = null;
    }
    if (this.scene && this.scene.mapMusic) {
      this.scene.mapMusic.resume();
    }
    this.boss2Alive = false;
    this.dropItem();
    super.destroy(fromScene);
  }
}
