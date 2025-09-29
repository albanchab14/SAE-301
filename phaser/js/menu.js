export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }
    //on charge les images
    preload() {
        this.load.image("menu_fond", "./assets/menu_jeu.png"); // fond du menu
        this.load.image("imageBoutonPlay", "./assets/bouton_play.png"); // bouton play
    }

    create() {
        // on place les éléments de fond
        this.add.image(0, 0, "menu_fond")
        .setOrigin(0)
        .setDepth(0);

        // on ajoute un bouton de clic, nommé bouton_play
        var bouton_play = this.add.image(625, 550, "imageBoutonPlay").setDepth(1);

        // on rend le bouton interratif
        bouton_play.setInteractive();

        bouton_play.on("pointerover", () => { // quand la souris est au-dessus du bouton
            bouton_play.setScale(1.1);
        });
        bouton_play.on("pointerout", () => { // quand la souris sort du bouton
            bouton_play.setScale(1); 
        });

        bouton_play.on("pointerup", () => { // au clic
            this.scene.start("selection"); // lancer
        });
    }
    }