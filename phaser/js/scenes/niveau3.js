// entities/squelette.js
import Enemy from "./enemy.js";

export default class Squelette extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "skeleton_idle");
    this.setScale(1.2);
    this.vie = 3;
    this.dropChance = 0.25;
    this.setCollideWorldBounds(true);
    this.body.allowGravity = true;

    this.speed = 60;
    this.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
    this.detectionRange = 120;
    this.attackCooldown = 1000;
    this.lastAttackTime = 0;
    this.state = "idle";
    
    // Distance de détection du bord (en pixels devant le squelette)
    this.edgeDetectionDistance = 5;
    this.lastDirectionChange = 0;
    this.directionChangeCooldown = 500;

    // Définit la hitbox pour chaque état
    this.hitboxes = {
      idle: { width: 34 * 1.2, height: 46 * 1.2, offsetX: 0, offsetY: 0 },
      walk: { width: 39 * 1.2, height: 48 * 1.2, offsetX: 0, offsetY: 0 },
      attack: { width: 58 * 1.2, height: 47 * 1.2, offsetX: 0, offsetY: 0 }
    };

    this.setHitbox("idle");

    // Animation de départ
    this.play(this.direction === 1 ? "skeleton_idle_right" : "skeleton_idle_left");
  }

  setHitbox(state) {
    const hb = this.hitboxes[state];
    this.body.setSize(hb.width, hb.height);
    this.body.setOffset(hb.offsetX, hb.offsetY);
  }

  update(player) {
    if (!this.body || !player) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const now = this.scene.time.now;

    // --- Attaque si joueur proche et cooldown écoulé ---
    if (distance < this.detectionRange && now - this.lastAttackTime > this.attackCooldown) {
        this.lastAttackTime = now;
        this.state = "attack";
        this.body.setVelocityX(0);

        // Regarde vers le joueur
        this.direction = player.x > this.x ? 1 : -1;

        // Hitbox attaque décalée vers l'avant
        if (this.direction === 1) {
            this.body.setSize(58, 47);
            this.body.setOffset(1, 0);
            this.play("skeleton_attack_right", true);
        } else {
            this.body.setSize(58, 47);
            this.body.setOffset(-1, 0);
            this.play("skeleton_attack_left", true);
        }

        // Quand l'animation d'attaque est finie → retour idle
        this.once("animationcomplete", () => {
            this.state = "idle";

            // Hitbox normale centrée
            this.body.setSize(34, 46);
            this.body.setOffset(10, 0);
            this.play(this.direction === 1 ? "skeleton_idle_right" : "skeleton_idle_left", true);
        });

        return; // stop update pour cette frame
    }

    // --- Patrouille basique avec détection de bord ---
    if (this.state !== "attack") {
        // Détecte si le squelette est sur le sol
        const onGround = this.body.blocked.down || this.body.touching.down;

        // Change de direction si collision avec un mur
        if (this.body.blocked.left && now - this.lastDirectionChange > this.directionChangeCooldown) {
            this.direction = 1;
            this.lastDirectionChange = now;
        } else if (this.body.blocked.right && now - this.lastDirectionChange > this.directionChangeCooldown) {
            this.direction = -1;
            this.lastDirectionChange = now;
        }

        // Détection du bord de plateforme (seulement si on est au sol)
        if (onGround && now - this.lastDirectionChange > this.directionChangeCooldown) {
            // Point de vérification devant le squelette (au niveau des pieds)
            const checkX = this.direction === 1 
                ? this.x + this.body.width / 2 + this.edgeDetectionDistance
                : this.x - this.body.width / 2 - this.edgeDetectionDistance;
            const checkY = this.y + this.body.height / 2 + 5;

            // Vérifie s'il y a une plateforme devant
            const tile = this.scene.platformLayer?.getTileAtWorldXY(checkX, checkY);
            
            // Si pas de tile devant = bord de plateforme → demi-tour
            if (!tile) {
                this.direction *= -1;
                this.lastDirectionChange = now;
            }
        }

        // Applique le mouvement
        this.setVelocityX(this.speed * this.direction);

        // Hitbox marche centrée sur le corps
        this.body.setSize(39, 48);

        // Animation marche selon direction
        const animName = this.direction === 1 ? "skeleton_walk_right" : "skeleton_walk_left";
        if (this.anims.currentAnim?.key !== animName) {
            this.play(animName, true);
        }
    }
  }
}