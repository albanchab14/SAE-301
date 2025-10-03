// fonctions.js

// --- Fonction d'attaque du joueur ---
export function attack(player, scene, targets = null) {
  if (!player.canAttack) return; // sécurité anti spam

  player.canAttack = false;
  player.isAttacking = true;

  // Animation selon la direction
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

  // Collision avec les cibles
  if (targets) {
    scene.physics.add.overlap(hitbox, targets, (h, t) => {
      if (!t.justHit || scene.time.now - t.justHit > 300) {
        if (typeof t.vie === "undefined") t.vie = 3; 
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

// ...existing code...

function updateHearts(scene) {
  for (let i = 0; i < scene.coeurs.length; i++) {
    scene.coeurs[i].setFrame(i < scene.game.config.pointsDeVie ? 0 : 1);
    console.log("Nombre de vies :", scene.game.config.pointsDeVie);
  }
}


export let lifeManager = {
  init(scene, maxVies) {
  // Lis la valeur des PV si elle existe
  if (!scene.game.config.pointsDeVie) {
    scene.game.config.pointsDeVie = maxVies;
  }
  updateHearts(scene);
  console.log("Nombre de vies :", scene.game.config.pointsDeVie);
},

  retirerPV(scene, amount = 1) {
    scene.game.config.pointsDeVie -= amount;
    if (scene.game.config.pointsDeVie < 0) {
      scene.game.config.pointsDeVie = 0;
    }
    updateHearts(scene);
    console.log("Nombre de vies :", scene.game.config.pointsDeVie);
    // Tu peux ajouter ici un effet visuel ou sonore de perte de vie
  },

  heal(scene, amount = 1) {
    scene.game.config.pointsDeVie += amount;
    if (scene.game.config.pointsDeVie > scene.maxVies) {
      scene.game.config.pointsDeVie = scene.maxVies;
    }
    updateHearts(scene);
    // Tu peux ajouter ici un effet visuel ou sonore de heal
  },

  setMaxVies(scene, newMax) {
    scene.maxVies = newMax;
    if (scene.game.config.pointsDeVie > newMax) {
      scene.game.config.pointsDeVie = newMax;
    }
    updateHearts(scene);
  },

  updateHearts // Permet d'appeler fct.lifeManager.updateHearts(scene) si besoin
};