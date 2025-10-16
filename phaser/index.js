// chargement des librairies
import basescene from "./js/scenes/basescene.js";
import menu from "./js/scenes/menu.js";
import synopsis from "./js/scenes/synopsis.js";
import settings from "./js/scenes/settings.js";
import credits from "./js/scenes/credits.js";
import selection from "./js/scenes/selection.js";
import Niveau1 from "./js/scenes/niveau1.js";
import Niveau2 from "./js/scenes/niveau2.js";
import Niveau3 from "./js/scenes/niveau3.js";
import NiveauFinal from "./js/scenes/niveaufinal.js";
import defaite from "./js/scenes/defaite.js";
import victoire from "./js/scenes/victoire.js";
import PauseScene from "./js/scenes/pause.js";


// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
   type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  
  },
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 550 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [basescene, menu, synopsis, settings, credits, selection, Niveau1, Niveau2, Niveau3, NiveauFinal, defaite, victoire, PauseScene], // liste des scènes du jeu
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("menu");
