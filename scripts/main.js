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
            loader.once('complete', resolve);
            loader.load();
        });
        promises.push(prom);
    }

    return new Promise(function(resolve, reject) {
        Promise.all(promises).then(resolve);
    });
}

$(document).ready(function() {
    console.log('running');
    let screenSizer = setup.initialize();
    var p = fetchImages(screenSizer);
    p.then(function(l) {
        let loader = l[0];
        console.log(loader)
    })
});

function resizeScreen() {
    let screenSizer = setup.initialize();
}

$(window).resize(_.debounce(resizeScreen, 300));