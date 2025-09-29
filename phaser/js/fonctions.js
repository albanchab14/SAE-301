export function attack(player, scene, targets = null) {
    if (!player.canAttack) return; // sécurité

    player.canAttack = false;
    player.isAttacking = true; // flag pour bloquer idle/marche

    // Jouer l'animation selon la direction
    if (player.direction === "gauche") player.anims.play("attack_gauche");
    else player.anims.play("attack_droite");

    // Hitbox devant le joueur
    const width = 32;
    const height = player.height;
    const dir = player.direction === "gauche" ? -1 : 1;
    let x = player.x + dir * (player.width / 2 + width / 2);
    const y = player.y;

    const hitbox = scene.add.rectangle(x, y, width, height);
    scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);

    if (dir === -1) hitbox.x -= width / 2;
    else hitbox.x += width / 2;

    // Collision avec cibles
    if (targets) {
        scene.physics.add.overlap(hitbox, targets, (h, t) => {
            // ANTI-SPAM COUP: On ne touche qu'une fois par hitbox
            if (!t.justHit || scene.time.now - t.justHit > 300) {
                if (typeof t.vie === "undefined") t.vie = 2; // valeur cohérente avec le niveau
                t.vie -= 1;
                t.setTint(0xff0000);
                scene.time.delayedCall(500, () => t.setTint(0xffffff));
                t.justHit = scene.time.now;
                if (t.vie <= 0) t.destroy();
            }
        });
    }

    // Durée de l'attaque
    const attackDuration = 300; // ms
    scene.time.delayedCall(attackDuration, () => {
        hitbox.destroy();
        player.canAttack = true;
        player.isAttacking = false;
    });
}

export function updateHearts(scene) {
  for (let i = 0; i < scene.coeurs.length; i++) {
    scene.coeurs[i].setFrame(i < scene.game.config.pointsDeVie ? 0 : 1);
  }
}

