export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('pause');
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
        const buttonResume = this.add.text(this.sys.game.config.width / 2, 300, 'Reprendre (F)', {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => buttonResume.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => buttonResume.setStyle({ fill: '#ffffff' }))
        .on('pointerdown', () => this.handleResume());

        // Bouton Quitter
        const buttonQuit = this.add.text(this.sys.game.config.width / 2, 375, 'Quitter', {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => buttonQuit.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => buttonQuit.setStyle({ fill: '#ffffff' }))
        .on('pointerdown', () => this.handleQuit());

        // Gestion de la touche F pour reprendre
        this.input.keyboard.on('keydown-F', () => {
            this.handleResume();
        });
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
                this.scene.stop(this.previousScene);
            }
        }
        this.scene.start('menu');
    }
}
