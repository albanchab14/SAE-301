// === entities/bossfinal.js ===
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class BossFinal extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_bossFinal", 0);

    // === PARAMÈTRES ===
    this.maxVie = 12;
    this.vie = this.maxVie;
    this.detectionRange = 800;
    this.combatStarted = false;

    // === BARRE DE VIE ===
    this.lifeBar = scene.add.graphics();
    this.lifeBar.setDepth(10);
    this.updateLifeBar();

    // === PHYSIQUE ===
    this.setGravityY(400);
    this.setCollideWorldBounds(true);
    this.direction = -1;

    // === ETATS ===
    this.state = "idle";
    this.attackCooldown = 3000;
    this.lastAttack = 0;
    this.damage = 1;
    this.isAttacking = false;
    this.phase = 1;

    // === GROUPES / TIMERS ===
    this.projectilesGroup = scene.physics.add.group();
    this.activeTimers = [];

    // === ALERTE ===
    this.alert = scene.add.text(this.x, this.y - this.height, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);
  }

  // === BARRE DE VIE ===
  updateLifeBar() {
    const barWidth = 80;
    const barHeight = 10;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height - 26;

    this.lifeBar.clear();
    this.lifeBar.fillStyle(0x333333, 1);
    this.lifeBar.fillRect(x, y, barWidth, barHeight);

    const percent = Math.max(this.vie / this.maxVie, 0);
    const color = percent > 0.5 ? 0x06c80f : (percent > 0.2 ? 0xf8c200 : 0xdb222a);
    this.lifeBar.fillStyle(color, 1);
    this.lifeBar.fillRect(x, y, barWidth * percent, barHeight);
  }

  // === UPDATE ===
  update(platformLayer, player) {
    if (!this.body || !player) return;

    this.updateLifeBar();
    this.alert.setPosition(this.x, this.y - this.height);

    if (!this.combatStarted) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance > this.detectionRange) {
        this.playIdle();
        return;
      }
      this.combatStarted = true;
    }

    if (this.isAttacking) return;

    // Phase switch
    if (this.vie <= this.maxVie / 2 && this.phase === 1) {
      this.phase = 2;
      this.attackCooldown = 2000;
    }

    this.direction = player.x > this.x ? 1 : -1;

    const now = this.scene.time.now;
    if (now - this.lastAttack > this.attackCooldown) {
      this.alert.setVisible(true);
      let timer = this.scene.time.delayedCall(600, () => {
        this.alert.setVisible(false);
        this.chooseAttack(player);
      });
      this.activeTimers.push(timer);
      this.lastAttack = now;
    } else {
      this.playIdle();
    }
  }

  // === ANIMATIONS ===
  playIdle() {
    if (this.direction === 1) this.anims.play("bossfinal_idle_right", true);
    else this.anims.play("bossfinal_idle_left", true);
  }

  playAttack() {
    if (this.direction === 1) this.anims.play("bossfinal_attack_right", true);
    else this.anims.play("bossfinal_attack_left", true);
  }

  // === CHOIX D’ATTAQUE PAR PHASE ===
  chooseAttack(player) {
    this.isAttacking = true;

    let attacks;
    if (this.phase === 1) attacks = ["projectile", "smash", "teleport", "fireRain"];
    else attacks = ["projectileAir", "smash", "teleport", "fireRainIntense"];

    const chosen = Phaser.Utils.Array.GetRandom(attacks);

    switch (chosen) {
      case "projectile": this.attackProjectile(player); break;
      case "projectileAir": this.attackProjectileAir(player); break;
      case "smash": this.attackSmash(); break;
      case "teleport": this.attackTeleport(player); break;
      case "fireRain": this.attackFireRain(); break;
      case "fireRainIntense": this.attackFireRainIntense(); break;
    }
  }

  // === ATTAQUES ===
  attackProjectile(player) {
    this.playAttack();
    let shots = 0;
    const maxShots = 3;

    let timer = this.scene.time.addEvent({
      delay: 2000,
      repeat: maxShots - 1,
      callback: () => {
        if (!this.active) return;
        let projectile = this.projectilesGroup.create(this.x, this.y - 20, "bossfinal_projectile");
        projectile.body.setAllowGravity(false);
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        const speed = 300;
        projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        projectile.setRotation(angle);

        shots++;
        if (shots >= maxShots) this.isAttacking = false;
      }
    });
    this.activeTimers.push(timer);
  }

  attackProjectileAir(player) {
  this.playAttack();
  this.body.setAllowGravity(false);
  const targetY = this.y - 500;

  this.scene.tweens.add({
    targets: this,
    y: targetY,
    duration: 300,
    ease: "Power2",
    onComplete: () => {
      let shots = 0;
      const maxShots = 3;
      let timer = this.scene.time.addEvent({
        delay: 1000,
        repeat: maxShots - 1,
        callback: () => {
          if (!this.active) return;

          let projectile = this.projectilesGroup.create(this.x, this.y, "bossfinal_projectile");
          projectile.body.setAllowGravity(false);

          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const angle = Math.atan2(dy, dx);
          const speed = 400;
          projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
          projectile.setRotation(angle);

          shots++;
          if (shots >= maxShots) {
            // Remet la gravité et un mini-cooldown avant la prochaine attaque
            this.body.setAllowGravity(true);
            this.scene.time.delayedCall(500, () => {
              this.isAttacking = false;
            });
          }
        }
      });
      this.activeTimers.push(timer);
    }
  });
}


  attackSmash() {
    this.playAttack();
    this.setVelocityY(-400);
    let timer = this.scene.time.delayedCall(500, () => {
      this.createShockwave();
      this.isAttacking = false;
    });
    this.activeTimers.push(timer);
  }

  attackTeleport(player) {
    let newX = Phaser.Math.Between(100, this.scene.map4.widthInPixels - 100);
    const minDistance = 300;
    if (Math.abs(newX - player.x) < minDistance) {
      newX += newX > player.x ? minDistance : -minDistance;
    }
    this.setX(newX);
    this.isAttacking = false;
  }

  attackFireRain() {
    const nb = 3; // phase 1
    for (let i = 0; i < nb; i++) {
      let timer = this.scene.time.delayedCall(i * 1000, () => {
        let x = Phaser.Math.Between(100, this.scene.map4.widthInPixels - 100);
        let fire = this.projectilesGroup.create(x, this.y - 500, "bossfinal_projectile");
        fire.body.setAllowGravity(true);
        fire.setVelocityY(300);
        if (i === nb - 1) this.isAttacking = false;
      });
      this.activeTimers.push(timer);
    }
  }

  attackFireRainIntense() {
    const nb = 5; // phase 2
    for (let i = 0; i < nb; i++) {
      let timer = this.scene.time.delayedCall(i * 500, () => {
        for (let j = 0; j < 2; j++) {
          let x = Phaser.Math.Between(100, this.scene.map4.widthInPixels - 100);
          let fire = this.projectilesGroup.create(x, this.y - 500, "bossfinal_projectile");
          fire.body.setAllowGravity(true);
          fire.setVelocityY(350);
        }
        if (i === nb - 1) this.isAttacking = false;
      });
      this.activeTimers.push(timer);
    }
  }

  createShockwave() {
    const range = 120;
    const player = this.scene.player;
    if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < range) {
      fct.lifeManager.retirerPV(this.scene, 1);
      player.setTint(0xff0000);
      this.scene.time.delayedCall(300, () => player.clearTint());
    }
  }

  // === DÉGÂTS ===
  takeDamage(amount = 1) {
    this.vie = Math.max(0, this.vie - amount);
    this.setTint(0xff6666);
    this.scene.time.delayedCall(200, () => this.clearTint());
    this.updateLifeBar();

    if (this.vie <= 0) this.destroy();
  }

  // === DESTRUCTION ===
  destroy(fromScene) {
    if (this.activeTimers) {
        this.activeTimers.forEach(t => t.remove());
        this.activeTimers = [];
    }
    if (this.alert) this.alert.destroy();
    if (this.lifeBar) this.lifeBar.destroy();

    if (this.bossMusic?.isPlaying) this.bossMusic.stop();

    if (this.scene?.porte_retour_boss?.body) {
        this.scene.porte_retour_boss.setVisible(true);
        this.scene.porte_retour_boss.body.enable = true;
    }

    if (this.scene?.mapMusic) this.scene.mapMusic.resume();

    if (this.scene?.bossNameText) {
      this.scene.bossNameText.destroy();
    }
    // ✅ Détruire ou cacher la barre de vie longue
    if (this.scene?.bossHealthBar) {
        this.scene.bossHealthBar.destroy();
        this.scene.bossHealthBar = null;
    }
    if (this.scene?.bossHealthBarBg) {
        this.scene.bossHealthBarBg.destroy();
        this.scene.bossHealthBarBg = null;
    }
    super.destroy(fromScene);
    }

}
