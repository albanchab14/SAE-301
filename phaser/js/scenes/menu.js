import { resetGameData } from "../fonctions.js";

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

        this.load.audio("menu_fond", "./assets/sfx/menu.mp3");
    }

    create() {
        resetGameData(this.game);
        
        this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);

        // ✅ Vérifie si la musique existe déjà
        const existingMusic = this.sound.get("menu_fond");
        if (!existingMusic) {
            // Aucune musique trouvée → on la crée
            this.menuMusic = this.sound.add("menu_fond", { loop: true, volume: 0.3 });
            this.menuMusic.play();
            console.log("🎵 Nouvelle musique lancée !");
        } else {
            // Elle existe → on s’assure qu’elle joue bien
            if (!existingMusic.isPlaying) {
                existingMusic.play();
                console.log("🎵 Musique relancée !");
            } else {
                console.log("🎵 Musique déjà en cours, pas de double !");
            }
        }

        // --- Boutons ---
        bouton_play = this.add.image(640, 350, "imageBoutonPlay").setDepth(1);
        bouton_settings = this.add.image(640, 450, "settings_bouton").setDepth(1);
        bouton_credits = this.add.image(640, 550, "credits_bouton").setDepth(1);

        this.buttons = [bouton_play, bouton_settings, bouton_credits];

        // Interactions
        this.buttons.forEach((btn, idx) => {
            btn.setInteractive();
            btn.on("pointerover", () => this.selectButton(idx));
            btn.on("pointerout", () => this.unselectButton(idx));
        });

        bouton_play.on("pointerup", () => this.scene.start("synopsis"));
        bouton_settings.on("pointerup", () => this.scene.start("settings"));
        bouton_credits.on("pointerup", () => this.scene.start("credits"));

        // Gestion clavier
        this.input.keyboard.on("keydown-UP", () => {
            this.selectButton((this.selectedIndex + this.buttons.length - 1) % this.buttons.length);
        });
        this.input.keyboard.on("keydown-DOWN", () => {
            this.selectButton((this.selectedIndex + 1) % this.buttons.length);
        });
        this.input.keyboard.on("keydown-I", () => {
            if (this.selectedIndex === 0) this.scene.start("synopsis");
            if (this.selectedIndex === 1) this.scene.start("settings");
            if (this.selectedIndex === 2) this.scene.start("credits");
        });

        this.selectButton(0);
    }

    selectButton(index) {
        if (this.buttons[this.selectedIndex]) {
            this.buttons[this.selectedIndex].setScale(1);
        }
        this.selectedIndex = index;
        this.buttons[this.selectedIndex].setScale(1.1);
    }

    unselectButton(index) {
        this.buttons[index].setScale(1);
    }
}
