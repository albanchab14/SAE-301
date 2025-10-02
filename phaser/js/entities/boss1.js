
export default class Boss1 extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'img_boss1'); // Assure-toi que le spritesheet ou image 'img_boss1' est préchargé
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    // Ajoute comportements, IA, etc.
  }
  // Ajoute ici update, attaques, IA, etc.
}
