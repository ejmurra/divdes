require('babel-polyfill');
const PIXI = require('pixi.js');
const $ = require('jquery');
import {AssetLoader} from './AssetLoader';
import {Smoothie} from './Smoothie';
const debounce = require('lodash.debounce');

function getScreenSize() {
  let width = $(window).innerWidth();
  let height = $(window).innerHeight();
  return {
    width: width,
    height: height,
    aspect: height/width
  }
}

let loadScene = (renderer, smoothie, renderLoop, {characterManager, uiManager, backgroundManager}, first) => {
  return () => {
    // $(window).unbind('resize');
    if (first) {
      $(window).on('resize', debounce(resizeToDesert, 300));
    }

    $('.container').remove();
    $('body').append(renderer.view);
    renderLoop.call(smoothie);
    uiManager.showScreenArea({characterManager});
    characterManager.displayBioBox();
  }
};

function addLoadButton() {
  let loading = $('#loading-bar');
  $('#bar').remove();
  let button = $('<button style="width: 100%" class="btn-lg btn-warning">Enter the desert</button>');
  loading.append(button);
  return button;
}

let resizeToDesert = () => {
  $("#prev, #next, #videoFrame, #closeBtn, #iconBox, canvas").remove();
  $('body').css({"background-color": "black", height: '100vh', width: '100vw'});
  let bar = $(`<progress id="center-bar" max="100" value="0">Loading...</progress>`)
  bar.css({
    position: "absolute",
    width: "50vw",
    left: "25vw",
    top: "51vh",
  })
  $('body').append(bar);

  // Initialize
  let screen = getScreenSize();
  let availableSizes = [
    {
      width: 3840,
      height: 2160
    },
    {
      width: 1920,
      height: 1080
    },
    {
      width: 960,
      height: 540
    },
    {
      width: 480,
      height: 270
    }
  ];
  let characters = [
    {
      name: 'alma',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'tayo',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'jeremy',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'kyra',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'chineze',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: "shareefah",
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: "maya",
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'donovan',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    }
  ];
  let updateFunc = (loader) => {
    bar.attr('value', Math.round(loader.progress))
  };

  let assets = new AssetLoader({screen, availableSizes, characters, updateFunc});

  assets.load().then(({characterManager, backgroundManager, uiManager}) => {
    bar.remove();
    let renderer = PIXI.autoDetectRenderer($(window).innerWidth(), $(window).innerHeight());
    let stage = new PIXI.Container();
    stage.addChild(backgroundManager.container);
    stage.addChild(characterManager.container);
    stage.addChild(uiManager.container);

    uiManager.setup({characterManager, backgroundManager});

    let update = () => {
      renderer.render(stage);
      characterManager.container.children.map(sprite => {
        sprite.x += sprite.vx;
      });
      backgroundManager._moveableLayers.map(layer => {
        // let multiplier = layer.layer + 1;
        // layer.texture.tilePosition.x += multiplier * layer.texture.vx;
        layer.texture.tilePosition.x += layer.texture.vx;
      })
    };

    var smoothie = new Smoothie({
      engine: PIXI,
      renderer: renderer,
      root: stage,
      fps: 60,
      update: update.bind(this)
    });
    
    loadScene(renderer, smoothie, smoothie.start, {characterManager, backgroundManager, uiManager}, false)();
  })
};

let init = () => {
  let screen = getScreenSize();
  let availableSizes = [
    {
      width: 3840,
      height: 2160
    },
    {
      width: 1920,
      height: 1080
    },
    {
      width: 960,
      height: 540
    },
    {
      width: 480,
      height: 270
    }
  ];
  let characters = [
    {
      name: 'alma',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'tayo',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'jeremy',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'kyra',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'chineze',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: "shareefah",
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: "maya",
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    },
    {
      name: 'donovan',
      hover: '1-16',
      click: '17-32',
      touch: '1-32'
    }
  ];
  let updateFunc = (loader) => {
    let bar = $('#bar');
    bar.attr('value', Math.round(loader.progress))
  };


  let assets = new AssetLoader({screen, availableSizes, characters, updateFunc});
  
  assets.load().then(({characterManager, backgroundManager, uiManager}) => {
    let renderer = PIXI.autoDetectRenderer($(window).innerWidth(), $(window).innerHeight());
    let loadButton = addLoadButton();
    let stage = new PIXI.Container();
    stage.addChild(backgroundManager.container);
    stage.addChild(characterManager.container);
    stage.addChild(uiManager.container);

    uiManager.setup({characterManager, backgroundManager});

    let update = () => {
      renderer.render(stage);
      characterManager.container.children.map(sprite => {
        sprite.x += sprite.vx;
      });
      backgroundManager._moveableLayers.map(layer => {
        // let multiplier = layer.layer + 1;
        // layer.texture.tilePosition.x += multiplier * layer.texture.vx;
        layer.texture.tilePosition.x += layer.texture.vx;
      })
    };

    var smoothie = new Smoothie({
      engine: PIXI,
      renderer: renderer,
      root: stage,
      fps: 60,
      update: update.bind(this)
    });


    loadButton.on('click', loadScene(renderer, smoothie, smoothie.start, {characterManager, backgroundManager, uiManager}, true))
  })
};

$(document).on('ready', init);
// $(window).on('resize', debounce(resizeFromStart(), 300));
