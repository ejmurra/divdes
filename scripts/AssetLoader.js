const PIXI = require('pixi.js');
import {BackgroundManager, CharacterManager, UIManager} from "./Managers";

export class AssetLoader {
  constructor({screen, availableSizes, characters, updateFunc}) {
    this._screen = screen;
    this._targetAspect = 1920/1080;
    this._availableSizes = availableSizes;
    this._characters = characters;
    this._updateFunc = updateFunc;
  }
  
  resize(screen) {
    // TODO: Decide if AssetLoader should handle resize or just teardown and create a new instance. 
  }

  calculateSize(availableSizes) {


    let width = this._screen.width;
    let height = this._screen.height;

    let currentAspect = this._screen.aspect;
    let targetAspect = this._targetAspect;

    if (currentAspect == targetAspect) {
      // window fits properly, no letterbox
      let sizeDiffs = availableSizes.map(size => {
        return Math.abs(Number(width) - size.width);
      });
      let min = Math.min.apply(Math, sizeDiffs);
      return availableSizes[sizeDiffs.indexOf(min)]
    } else if (currentAspect < targetAspect) {
      // wider
      let sizeDiffs = availableSizes.map(size => {
        return Math.abs(Number(height) - size.height);
      });
      let min = Math.min.apply(Math, sizeDiffs);
      return availableSizes[sizeDiffs.indexOf(min)]
    } else {
      // taller
      let sizeDiffs = availableSizes.map(size => {
        return Math.abs(Number(width) - size.width);
      });
      let min = Math.min.apply(Math, sizeDiffs);
      return availableSizes[sizeDiffs.indexOf(min)]
    }
  }

  organizeLoaderResources(loader) {

    return new Promise((resolve, reject) => {
      let background = [];
      let chars = {};
      let profiles = {};
      let bioBoxes = [];
      for (let asset in loader.resources) {
        if (asset.slice(0, 2) == 'bg') {
          background.push({
            layer: asset.split('-')[1],
            data: loader.resources[asset].data
          })
        } else if (asset.split('-')[1] === 'profile') {
          profiles[asset.split('-')[0]] = loader.resources[asset].data;
        } else if (asset.split('-')[0] === 'bio') {
          bioBoxes.push({
            name: asset.split('-')[1],
            data: loader.resources[asset].data
          })
        } else {
          let name = asset.split('-')[0];
          let availNames = Object.keys(chars);
          if (availNames.indexOf(name) === -1) {
            chars[name] = [];
          }
          // Full animation
          chars[name].push(loader.resources[asset]);
        }
      }

      for (let char in chars) {
        // Full reverse animation
        let reversed = Array.from(chars[char]).reverse();


        for (let asset of reversed) {
          chars[char].push(asset);
        }
      }

      let bgContainer = new PIXI.Sprite();
      let characterContainer = new PIXI.Sprite();
      let UIContainer = new PIXI.Sprite();

      let managerBase = {
        targetAspect: this._targetAspect,
        screen: this._screen
      };

      let bgOpts = Object.assign({}, managerBase, {
        bg: background,
        size: this.calculateSize(this._availableSizes),
        container: bgContainer,
        bioBoxes
      });

      let backgroundManager = new BackgroundManager(bgOpts);
      
      let characterOpts = Object.assign({}, managerBase, {
        container: characterContainer,
        chars,
        profiles,
        backgroundManager
      });
      
      let characterManager = new CharacterManager(characterOpts);
      

      let UIOpts = Object.assign({}, managerBase, {
        container: UIContainer,
        size: this.calculateSize(this._availableSizes),
        scale: backgroundManager.scale.x
      });
      let uiManager = new UIManager(UIOpts);

      resolve({characterManager, backgroundManager, uiManager})
    })
  };
  
  load() {
    let loader = new PIXI.loaders.Loader();
    let size = this.calculateSize(this._availableSizes);
    let characters = this._characters;
    let charNames = ['alma'];

    let getCharacterFrames = (character, size) => {
      let pathsToFetch = [];
      for (let frameNum = 1; frameNum < 33; frameNum++) {
        pathsToFetch.push(`./public/characters/${character.name}/frames/${size.width}/${frameNum}.png`)
      }
      return pathsToFetch;
    };

    let prom = new Promise((resolve, reject) => {
      for (let i = 0; i < 4; i++) {
        loader.add(`bg-${i}`, `./public/bg/${size.width}/${i}.png`)
      }

      for (let name of charNames) {
        loader.add(`bio-${name}`, `./public/bg/${size.width}/${name}.png`)
      }

      for (let character of characters) {
        let paths = getCharacterFrames(character, size);
        for (let path of paths) {
          loader.add(`${character.name}-${paths.indexOf(path)}`, path);
        }
        loader.add(`${character.name}-profile`, `./public/characters/${character.name}/profile.json`);
      }

      loader.once('complete', resolve);
      loader.on('progress', this._updateFunc);
      loader.load();
    });

    return prom.then(this.organizeLoaderResources.bind(this))
  }
}