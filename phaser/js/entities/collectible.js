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
        
        console.log("Collectible ramassé !");
        this.disableBody(true, true);

        if (!this.scene.collectedFragments) {
            this.scene.collectedFragments = 0;
        }
        this.scene.collectedFragments++;

        // Met à jour le texte
        if (this.scene.fragmentsText) {
            this.scene.fragmentsText.setText(`Fragments : ${this.scene.collectedFragments}/${this.scene.totalFragments}`);
        }
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
