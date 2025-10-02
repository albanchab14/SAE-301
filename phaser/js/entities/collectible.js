// entities/collectible.js

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, frameIndex) {
        super(scene, x, y, 'miroir_fragments', frameIndex);

        scene.add.existing(this);
        this.setOrigin(0.5, 0.5);
        this.collected = false;
    }



    collect() {
        if (this.collected) return;
        this.collected = true;

        if (typeof this.scene.game.config.collectedFragments !== "number") {
            this.scene.game.config.collectedFragments = 0;
        }

        this.disableBody(true, true);

        this.scene.game.config.collectedFragments++;
        
        this.scene.updateFragmentsText(this.scene.game.config.collectedFragments, 9);
    }



  // Méthode statique pour créer tous les collectibles à partir du calque "collectibles"
  static createFromTilemap(scene, tilemapLayer) {
    const collectiblesGroup = scene.physics.add.staticGroup();

    const objects = tilemapLayer.objects;

    for (const obj of objects) {
        if (obj.properties) {
        const typeProp = obj.properties.find(p => p.name === 'type');
        if (typeProp && typeProp.value === 'miroir_fragment') {
            const textureProp = obj.properties.find(p => p.name === 'texture');
            const frameIndex = textureProp ? parseInt(textureProp.value, 10) : 0;

            const collectible = new Collectible(scene, obj.x, obj.y - 32, frameIndex);
            collectiblesGroup.add(collectible);
        }
        }
    }

    return collectiblesGroup;
    }
}
