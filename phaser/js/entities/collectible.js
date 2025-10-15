// entities/collectible.js

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, frameIndex, textureKey = "miroir_fragments") {
        super(scene, x, y, textureKey, frameIndex);

        scene.add.existing(this);
        this.setOrigin(0.5, 0.5);
        this.collected = false;
    }

    collect() {
        if (this.collected) return;
        this.collected = true;

        this.disableBody(true, true);

        // --- Gestion fragments ---
        if (this.type === "fragment") {
            if (typeof this.scene.game.config.collectedFragments !== "number") {
                this.scene.game.config.collectedFragments = 0;
            }
            this.scene.game.config.collectedFragments++;
            this.scene.updateFragmentsText(this.scene.game.config.collectedFragments, 9);
        }

        // --- Gestion cristaux uniques ---
        if (this.type === "cristal") {
            if (!this.scene.game.config.crystals) {
                this.scene.game.config.crystals = {};
            }
            this.scene.game.config.crystals[this.crystalColor] = true;
        }
    }

    // Crée les collectibles depuis Tiled
    static createFromTilemap(scene, tilemapLayer) {
        const collectiblesGroup = scene.physics.add.staticGroup();
        const objects = tilemapLayer.objects;

        for (const obj of objects) {
            if (!obj.properties) continue;

            const typeProp = obj.properties.find(p => p.name === 'type');

            // --- FRAGMENTS ---
            if (typeProp && typeProp.value === 'miroir_fragment') {
                const textureProp = obj.properties.find(p => p.name === 'texture');
                const frameIndex = textureProp ? parseInt(textureProp.value, 10) : 0;

                const collectible = new Collectible(scene, obj.x, obj.y - 32, frameIndex);
                collectible.type = "fragment";
                collectiblesGroup.add(collectible);
            }

            // --- CRISTAUX ---
            if (typeProp && typeProp.value.startsWith("cristal_")) {
                const colorMap = { vert: "green", bleu: "blue", violet: "violet" };
                const color = typeProp.value.replace("cristal_", ""); // ex: "cristal_vert" → "vert"

                const collectible = new Collectible(scene, obj.x, obj.y - 32, 0, `cristal_${color}`);
                collectible.type = "cristal";
                collectible.crystalColor = color;
                collectiblesGroup.add(collectible);
            }
        }

        return collectiblesGroup;
    }
}
