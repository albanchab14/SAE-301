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
            t.setTint(0xff0000);
            t.destroy();
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
