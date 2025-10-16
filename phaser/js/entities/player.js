import fct from '../fonctions.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'img_perso');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    
    this.speed = 180;
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
  }

  die() {
    this.scene.physics.pause();
    this.scene.scene.start('defaite');
  }
}
