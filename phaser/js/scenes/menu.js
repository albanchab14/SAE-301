var bouton_play;
var bouton_settings;
var bouton_credits;


export default class menu extends Phaser.Scene {
    constructor() {
        super({ key: "menu" });
        this.selectedIndex = 0;
        this.buttons = [];
    }

    preload() {
        this.load.image("menu_fond", "./assets/menu.png");
        this.load.image("imageBoutonPlay", "./assets/play_bouton.png");
        this.load.image("settings_bouton", "./assets/settings_bouton.png");
        this.load.image("credits_bouton", "./assets/credits_bouton.png");
        this.load.image("menu_bouton", "./assets/menu_bouton.png");
    }

    create() {
        this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);

        // Création des boutons
        bouton_play = this.add.image(640, 350, "imageBoutonPlay").setDepth(1);
        bouton_settings = this.add.image(640, 450, "settings_bouton").setDepth(1);
        bouton_credits = this.add.image(640, 550, "credits_bouton").setDepth(1);

        this.buttons = [bouton_play, bouton_settings, bouton_credits];

        // Rendre interactif à la souris
        this.buttons.forEach((btn, idx) => {
            btn.setInteractive();
            btn.on("pointerover", () => {
                this.selectButton(idx);
            });
            btn.on("pointerout", () => {
                this.unselectButton(idx);
            });
        });

        bouton_play.on("pointerup", () => this.scene.start("selection"));
        bouton_settings.on("pointerup", () => this.scene.start("settings"));
        bouton_credits.on("pointerup", () => this.scene.start("credits"));

        // Initialiser la sélection
        this.selectButton(0);

        // Gestion clavier
        this.input.keyboard.on("keydown-UP", () => {
            this.selectButton((this.selectedIndex + this.buttons.length - 1) % this.buttons.length);
        });
        this.input.keyboard.on("keydown-DOWN", () => {
            this.selectButton((this.selectedIndex + 1) % this.buttons.length);
        });
        this.input.keyboard.on("keydown-I", () => {
            if (this.selectedIndex === 0) this.scene.start("selection");
            if (this.selectedIndex === 1) this.scene.start("settings");
            if (this.selectedIndex === 2) this.scene.start("credits");
        });
    }

    selectButton(index) {
        // Désélectionner l'ancien bouton
        if (this.buttons[this.selectedIndex]) {
            this.buttons[this.selectedIndex].setScale(1);
        }
        // Sélectionner le nouveau bouton
        this.selectedIndex = index;
        this.buttons[this.selectedIndex].setScale(1.1);
    }

    unselectButton(index) {
        this.buttons[index].setScale(1);
    }
}