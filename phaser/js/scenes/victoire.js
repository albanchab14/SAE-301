var bouton_retour;

export default class victoire extends Phaser.Scene {
    constructor() {
        super({ key: "victoire" });
        this.selectedIndex = 0;
        this.buttons = [];
    }

    preload() {
        this.load.image("victoire_fond", "./assets/victoire_1.png");
    }

    create() {

        // on place les éléments de fond
        this.add.image(0, 0, "victoire_fond")
        .setOrigin(0)
        .setDepth(0);

        // Création des boutons
        bouton_retour = this.add.image(645, 650, "menu_bouton").setDepth(1);

        // on rend le bouton interratif
        bouton_retour.setInteractive();

        bouton_retour.on("pointerover", () => { // quand la souris est au-dessus du bouton
            bouton_retour.setScale(1.1);
        });
        bouton_retour.on("pointerout", () => { // quand la souris sort du bouton
            bouton_retour.setScale(1); 
        });

        bouton_retour.on("pointerup", () => { // au clic
            this.scene.start("menu");
        });

        this.input.keyboard.on('keydown-I', () => {
            this.scene.start("menu");
        });
    }
}