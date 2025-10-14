// entities/boss2.js
import Enemy from "./enemy.js";
import * as fct from "../fonctions.js";

export default class Boss2 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "img_boss2", 0);

    this.vie = 10; // Vie plus courte
    this.setGravityY(300);
    this.setCollideWorldBounds(true);

    this.state = "idle";
    this.detectionRange = 600;
    this.attackCooldown = 2800; // rythme plus lent
    this.lastAttack = 0;
    this.damage = 1; // dégâts réduits

    this.projectileSpeed = 200;
    this.projectileLife = 4000;

    this.phase = 1;
    this.hasDroppedCrystal = false;

    this.alert = scene.add.text(this.x, this.y, "!", {
      fontSize: "32px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setVisible(false);

    this.activeTimers = [];
  }

  update(platformLayer, player, projectilesGroup) {
    if (!this.body) return;
    this.alert.setPosition(this.x, this.y - this.height);

    // Passage en phase 2 (rage)
    if (this.vie <= 5 && this.phase === 1) {
      this.enterPhase2();
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const now = this.scene.time.now;

    if (distance < this.detectionRange && now - this.lastAttack > this.attackCooldown) {
      this.chooseAttack(player, projectilesGroup);
      this.lastAttack = now;
    }

    if (this.state === "idle") {
      if (this.direction === 1)
        this.anims.play("boss2_idle_right", true);
      else this.anims.play("boss2_idle_left", true);
    }
    else if (this.state === "dash") {
      if (this.direction === 1)
        this.anims.play("boss2_idle_right", true);
      else this.anims.play("boss2_idle_left", true);
    }
    else if (this.state === "shoot") {
      if (this.direction === 1)
        this.anims.play("boss2_attack_right", true);
      else this.anims.play("boss2_attack_left", true);
    }
    else if (this.state === "jump") {
      if (this.direction === 1)
        this.anims.play("boss2_jump_right", true);
      else this.anims.play("boss2_jump_left", true);
    }
  }

  enterPhase2() {
    this.phase = 2;
    this.attackCooldown = 2200;
    this.projectileSpeed = 230;
    this.setTint(0xff6666);

    // petit effet dramatique
    this.scene.cameras.main.shake(400, 0.005);
    console.log("🔥 Cerbère entre en rage !");
  }

  chooseAttack(player, projectilesGroup) {
    const rand = Phaser.Math.Between(1, this.phase === 1 ? 2 : 3);
    if (rand === 1) this.fireAttack(player, projectilesGroup);
    else if (rand === 2) this.dashAttack(player);
    else if (rand === 3 && this.phase === 2) this.jumpAttack();
  }

  fireAttack(player, projectilesGroup) {
    if (!this.body) return;
    this.state = "shoot";
    this.alert.setVisible(true);

    const nbShots = this.phase === 2 ? 2 : 1;
    let delay = 0;

    for (let i = 0; i < nbShots; i++) {
      const attackTimer = this.scene.time.delayedCall(800 + delay, () => {
        if (!this.body) return;
        this.alert.setVisible(false);

        const direction = player.x > this.x ? 1 : -1;
        this.direction = direction;

        const offsetX = direction * 60;
        const projectile = this.scene.physics.add.sprite(this.x + offsetX, this.y - 30, "fireball");
        projectile.play("fireball_anim");
        projectilesGroup.add(projectile);
        projectile.body.setAllowGravity(false);

        // 🔥 Vitesse plus rapide selon la phase
        const speed = this.phase === 2 ? 320 : 280;

        const dx = player.x - projectile.x;
        const dy = player.y - projectile.y;
        const angle = Math.atan2(dy, dx);
        projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        projectile.setRotation(angle); // oriente la boule dans la direction du tir
        projectile.setFlipY(false);

        const width = 48;
        const height = 24;
        const rotatedWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
        const rotatedHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
        projectile.body.setSize(rotatedWidth, rotatedHeight);
        projectile.body.setOffset((width - rotatedWidth) / 2, (height - rotatedHeight) / 2);

        const projTimer = this.scene.time.delayedCall(this.projectileLife, () => {
          if (projectile.active) projectile.destroy();
        });
        this.activeTimers.push(projTimer);
      });
      this.activeTimers.push(attackTimer);
      delay += 400;
    }

    const resetTimer = this.scene.time.delayedCall(1000 + delay, () => (this.state = "idle"));
    this.activeTimers.push(resetTimer);
  }

  dashAttack(player) {
    if (!this.body) return;
    this.state = "dash";
    this.alert.setVisible(true);

    const direction = player.x > this.x ? 1 : -1;
    this.direction = direction;

    const dashTimer = this.scene.time.delayedCall(900, () => {
      if (!this.body) return;
      this.alert.setVisible(false);

      this.setVelocityX(400 * direction);

      const dashEnd = this.scene.time.delayedCall(500, () => {
        if (this.body) this.setVelocityX(0);
        this.state = "idle";
      });
      this.activeTimers.push(dashEnd);
    });
    this.activeTimers.push(dashTimer);
  }

  jumpAttack() {
    if (!this.body) return;
    this.state = "jump";
    this.alert.setVisible(true);

    const jumpTimer = this.scene.time.delayedCall(600, () => {
      if (!this.body) return;
      this.alert.setVisible(false);
      this.setVelocityY(-500);

      const impactTimer = this.scene.time.delayedCall(900, () => {
        if (!this.body) return;
        this.spawnFireRain(6); // 6 projectiles max
        this.state = "idle";
      });
      this.activeTimers.push(impactTimer);
    });
    this.activeTimers.push(jumpTimer);
  }

  spawnFireRain(count = 6) {
    const width = 48;   // largeur du sprite
    const height = 24;  // hauteur du sprite

    const adjustHitbox = (sprite, angle) => {
      const rotatedWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
      const rotatedHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
      sprite.body.setSize(rotatedWidth, rotatedHeight);
      sprite.body.setOffset((width - rotatedWidth) / 2, (height - rotatedHeight) / 2);
    };

    for (let i = 0; i < count; i++) {
      const x = this.x - 390 + i * 150;
      const fire = this.scene.physics.add.sprite(x, this.y - 300, "fireball");
      fire.play("fireball_anim");
      fire.body.setAllowGravity(true);
      fire.setVelocityY(250);

      // 🔹 On oriente la sprite et on ajuste la hitbox
      const angle = Math.PI / 2; // direction vers le bas
      fire.setRotation(angle);
      adjustHitbox(fire, angle);

      // ✅ Ajout au groupe global de projectiles si disponible
      if (this.scene.projectilesGroup) this.scene.projectilesGroup.add(fire);

      // ✅ Collision avec plateformes
      this.scene.physics.add.collider(fire, this.scene.calque_plateformes, () => fire.destroy());

      // ✅ Dégâts au joueur
      this.scene.physics.add.overlap(fire, this.scene.player, () => {
        if (!fire.active) return;
        fire.destroy();
        if (fct.lifeManager) fct.lifeManager.decrease(this.scene, this.damage || 1);
      });
    }
  }



  dropItem() {
    if (this.hasDroppedCrystal) return;
    this.hasDroppedCrystal = true;

    const scene = this.scene;
    const cristal = scene.physics.add.sprite(this.x, this.y, "cristal_bleu");
    cristal.setBounce(0.2);
    cristal.setCollideWorldBounds(true);
    scene.physics.add.collider(cristal, scene.calque_plateformes);

    scene.physics.add.overlap(scene.player, cristal, () => {
      fct.lifeManager.heal(scene, scene.maxVies);
      if (!scene.game.config.crystals)
        scene.game.config.crystals = { green: false, blue: false, violet: false };
      scene.game.config.crystals.blue = true;
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

    if (this.bossMusic && this.bossMusic.isPlaying) this.bossMusic.stop();
    this.bossMusic = null;

    super.destroy(fromScene);
  }
}
