require('babel-polyfill');
const setup = require('./setup');
const PIXI = require('pixi.js');
const $ = require('jquery');
const _ = require('lodash');
const animator = require('./AnimatedSprite');
const glob = require('glob');

function calculateSize(screen) {
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

    if (screen.orientation === 'horizontal') {
        let sizeDiffs = availableSizes.map(function(size) {
            return Math.abs(Number(screen.width) - size.width)
        });
        let min = Math.min.apply(Math, sizeDiffs);
        return availableSizes[sizeDiffs.indexOf(min)]
    }
    // TODO: handle portrait screens
}

function getCharacterFrames(character, size) {
    let pathsToFetch = [];
    for (let frameNum = 1; frameNum < 33; frameNum++) {
        pathsToFetch.push(`./characters/${character.name}/frames/${size.width}/${frameNum}.png`)
    }
    return pathsToFetch;
}

function fetchImages(screen) {
    let characters = [
        {
            name: 'tayo',
            hover: '1-16',
            click: '17-32',
            touch: '1-32'
        }
    ];
    let size = calculateSize(screen);
    let promises = [];

    // TODO: Get background images here

    // Get character sheets here
    for (let character of characters) {
        let prom = new Promise(function(resolve, reject) {
            let paths = getCharacterFrames(character, size);
            let loader = new PIXI.loaders.Loader();
            for (let path of paths) {
                loader.add(`${character.name}-${paths.indexOf(path)}`, path);
            }
            loader.add(`${character.name}-profile`, `./characters/${character.name}/profile.json`);
            loader.once('complete', resolve);
            loader.load();
        });
        promises.push(prom);
    }

    return new Promise(function(resolve, reject) {
        Promise.all(promises).then(resolve);
    });
}

function resizeScreen() {
    let screenSizer = setup.initialize();
}

$(window).resize(_.debounce(resizeScreen, 300));


$(document).ready(function() {
    let screenSizer = setup.initialize();
    var loadCharacters = fetchImages(screenSizer);
    loadCharacters.then(function(l) {
        let loader = l[0];
        let name;
        let images = [];

        for (let asset in loader.resources) {
            if (!name) name = asset.split('-')[0];
            if (loader.resources[asset].isImage) {
                images.push({
                    num: asset.split('-')[1],
                    data: loader.resources[asset].data
                });
            }
        }
        let profile = loader.resources[`${name}-profile`].data;

        let textures = images.map(image => {
            return {
                texture: new PIXI.BaseTexture(image.data),
                frame: image.num
            }
        });

        // Build sequences
        let sequences = {};
        for (let prop in profile) {
            if (typeof profile[prop] === 'object') {
                sequences[prop] = textures.filter(tex => {
                    return profile[prop].start <= Number(tex.frame) && Number(tex.frame) < profile[prop].stop;
                }).map(tex => {
                    return new PIXI.Texture(tex.texture)
                })
            }
        }

        let characterSprite = new PIXI.AnimatedSprite(sequences, 16, 'hover');
        console.log(characterSprite);

    })
});