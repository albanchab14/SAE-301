export default class Parchemin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, loreKey) {
        super(scene, x, y, "parchemin"); // image pliée
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // statique
        this.loreKey = loreKey; // ex: "parchemin0"
        this.isReading = false; // état lecture
        this.loreImage = null;
        this.infoText = null; // ✅ ajout pour le texte d’aide
    }

    interact() {
        if (this.isReading) {
            // Fermer le parchemin
            if (this.loreImage) this.loreImage.destroy();
            if (this.infoText) this.infoText.destroy();
            if (this.bgRect) this.bgRect.destroy(); // détruire le fond
            this.loreImage = null;
            this.infoText = null;
            this.bgRect = null;
            this.isReading = false;
            this.scene.player.isReadingParchemin = false; // ✅ réactive les interactions du joueur
        } else {
            // Afficher le fond noir transparent
            this.bgRect = this.scene.add.rectangle(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.centerY,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
                0x000000,
                0.5 // opacité
            )
            .setScrollFactor(0)
            .setDepth(99);

            // Afficher le parchemin
            this.loreImage = this.scene.add.image(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.centerY,
                this.loreKey
            )
            .setScrollFactor(0)
            .setDepth(100)
            .setOrigin(0.5)
            .setScale(1.3);
            console.log(
                `Parchemin image created:`,
                this.loreImage ? 'YES' : 'NO',
                `at x=${this.loreImage?.x}, y=${this.loreImage?.y}`
            );
            // Met la vitesse du joueur à 0 pour éviter qu'il continue à courir
            if (this.scene.player && this.scene.player.body) {
                this.scene.player.body.setVelocity(0, 0);
                this.scene.player.anims.play('anim_face', true);
            }

            // Texte aide pour refermer
            this.infoText = this.scene.add.text(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.centerY + 300, // 150 px sous le parchemin
                "Appuyez sur [I] pour refermer le parchemin",
                { fontSize: "24px", fill: "#ffffff", fontStyle: "italic" }
            )
            .setScrollFactor(0)
            .setOrigin(0.5)
            .setDepth(101);


            this.isReading = true;
            this.scene.player.isReadingParchemin = true; // ✅ désactive le mouvement & les portes
        }
    }

}
