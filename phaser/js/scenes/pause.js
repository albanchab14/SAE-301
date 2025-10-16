export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('pause');
        this.selectedButton = 0; // Pour suivre quel bouton est sélectionné
    }

    init(data) {
        this.previousScene = data.previous || null;
    }

    create() {
        // Fond semi-transparent noir
        this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.7)
            .setOrigin(0, 0);

        // Titre
        this.add.text(this.sys.game.config.width / 2, 200, 'PAUSE', {
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Bouton Reprendre
        this.buttonResume = this.add.text(this.sys.game.config.width / 2, 300, 'Reprendre', {
            fontSize: '32px',
            fill: '#ff0',
            stroke: '#000000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => this.selectButton(0))
        .on('pointerdown', () => this.handleResume());

        // Bouton Quitter
        this.buttonQuit = this.add.text(this.sys.game.config.width / 2, 375, 'Quitter', {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => this.selectButton(1))
        .on('pointerdown', () => this.handleQuit());

        // Nettoyage des anciens événements clavier s'ils existent
        this.input.keyboard.removeAllKeys(true);
        
        // Réinitialisation des touches
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyI = this.input.keyboard.addKey('I');
        
        // Réinitialisation des événements clavier
        this.input.keyboard.on('keydown-UP', () => this.changeSelection(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1));
        this.input.keyboard.on('keydown-I', () => this.validateSelection());

        // Sélection initiale
        this.selectButton(0);
    }

    selectButton(index) {
        this.selectedButton = index;
        this.buttonResume.setStyle({ fill: index === 0 ? '#ff0' : '#ffffff' });
        this.buttonQuit.setStyle({ fill: index === 1 ? '#ff0' : '#ffffff' });
    }

    changeSelection(direction) {
        let newSelection = this.selectedButton + direction;
        if (newSelection < 0) newSelection = 1;
        if (newSelection > 1) newSelection = 0;
        this.selectButton(newSelection);
    }

    validateSelection() {
        if (this.selectedButton === 0) {
            this.handleResume();
        } else {
            this.handleQuit();
        }
    }

    handleResume() {
        if (this.previousScene) {
            const previousScene = this.scene.get(this.previousScene);
            if (previousScene) {
                previousScene.resumeFromPause();
                this.scene.resume(this.previousScene);
            }
        }
        this.scene.stop();
    }

    handleQuit() {
        if (this.previousScene) {
            const previousScene = this.scene.get(this.previousScene);
            if (previousScene) {
                previousScene.isPaused = false;  // Réinitialiser l'état de pause
                this.sound.stopAll();
                this.scene.stop(this.previousScene);
            }
        }
        
        this.scene.stop();
        this.scene.start('menu');
    }
}
