var bouton_start;

export default class synopsis extends Phaser.Scene {
    constructor() {
        super({ key: "synopsis" });
        this.selectedIndex = 0;
        this.buttons = [];
    }

    preload() {
        this.load.image("synopsis_fond", "./assets/synopsis.png");
    }

    create() {

        // on place les éléments de fond
        this.add.image(0, 0, "synopsis_fond")
        .setOrigin(0)
        .setDepth(0);

        // Création des boutons
        bouton_start = this.add.image(645, 650, "imageBoutonPlay").setDepth(1);

        // on rend le bouton interratif
        bouton_start.setInteractive();

        bouton_start.on("pointerover", () => { // quand la souris est au-dessus du bouton
            bouton_start.setScale(1.1);
        });
        bouton_start.on("pointerout", () => { // quand la souris sort du bouton
            bouton_start.setScale(1); 
        });

        const menuMusic = this.sound.get("menu_fond");
        
        bouton_start.on("pointerup", () => { // au clic
            if (menuMusic && menuMusic.isPlaying) menuMusic.stop();
            this.scene.start("selection");
            
        });

        this.input.keyboard.on('keydown-I', () => {
            if (menuMusic && menuMusic.isPlaying) menuMusic.stop();
            this.scene.start("selection");
        });
    }
}