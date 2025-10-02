export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'img_perso');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    
    this.speed = 160;
    this.jumpSpeed = -350;
    
    this.lives = 5;
    this.maxLives = 5;
    this.canAttack = true;
    this.isAttacking = false;
    this.lastHit = 0;
    this.direction = 'right';

    this.isInvincible = false;
    this.invincibilityDuration = 1000;

    this.scene = scene;

    // Gestion animations à définir dans la scène ou ici
  }

  get lives() {
    // récupère la valeur globale dans la config du jeu
    return this.scene.game.config.pointsDeVie;
  }

  set lives(value) {
    // limite la valeur entre 0 et maxLife
    this.scene.game.config.pointsDeVie = Phaser.Math.Clamp(value, 0, this.maxLives);
  }

  update(cursors, attackKey) {
    if (this.isAttacking) return;

    // déplacement horizontal
    if (cursors.left.isDown) {
      this.setVelocityX(-this.speed);
      this.direction = 'left';
      this.play('walk_left', true);
    } else if (cursors.right.isDown) {
      this.setVelocityX(this.speed);
      this.direction = 'right';
      this.play('walk_right', true);
    } else {
      this.setVelocityX(0);
      this.play('idle', true);
    }

    // saut
    if (cursors.up.isDown && this.body.blocked.down) {
      this.setVelocityY(this.jumpSpeed);
      this.play('jump', true);
    }

    // attaque
    if (Phaser.Input.Keyboard.JustDown(attackKey) && this.canAttack) {
      this.attack();
    }
  }

  attack() {
    this.canAttack = false;
    this.isAttacking = true;

    // animation d'attaque selon direction
    if (this.direction === 'left') {
      this.play('attack_gauche');
    } else {
      this.play('attack_droite');
    }

    // hitbox d'attaque
    const width = 32;
    const height = this.height;
    const dir = this.direction === 'left' ? -1 : 1;
    let x = this.x + dir * (this.width / 2 + width / 2);
    let y = this.y;

    const hitbox = this.scene.add.rectangle(x, y, width, height);
    this.scene.physics.add.existing(hitbox);
    hitbox.body.allowGravity = false;
    hitbox.body.immovable = true;

    if (dir === -1) hitbox.x -= width / 2;
    else hitbox.x += width / 2;

    // Garde hitbox accessible pour scène (détecter collision avec ennemis)
    this.scene.physics.add.overlap(hitbox, this.scene.enemies, (hb, enemy) => {
      if (!enemy.justHit || this.scene.time.now - enemy.justHit > 300) {
        enemy.vie = enemy.vie ?? 3;
        enemy.vie -= 1;
        enemy.setTint(0xff0000);
        this.scene.time.delayedCall(500, () => enemy.clearTint());
        enemy.justHit = this.scene.time.now;
        if (enemy.vie <= 0) enemy.destroy();
      }
    });

    // durée attaque et suppression hitbox
    this.scene.time.delayedCall(300, () => {
      hitbox.destroy();
      this.canAttack = true;
      this.isAttacking = false;
    });
  }


  

  die() {
    this.scene.physics.pause();
    this.scene.scene.start('defaite');
  }
}
