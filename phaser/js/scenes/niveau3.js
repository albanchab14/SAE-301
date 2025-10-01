// scenes/niveau3.js
import * as fct from '../fonctions.js';
import Basescene from "./basescene.js";
import Collectible from '../entities/collectible.js';

export default class Niveau3 extends Basescene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    // chargement des assets spécifiques au niveau 3
  }

  create() {
    // création du niveau 3
  }

  update() {
    this.updatePlayerMovement();
    this.handleAttack();
  }
}
