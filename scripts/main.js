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
    return new Promise(function(resolve, reject) {
        let loader = new PIXI.loaders.Loader();
        for (let i = 0; i < 3; i++) {
            loader.add(`bg-${i}`, `./bg/${size.width}/${i}.png`)
        }

        for (let character of characters) {
            let paths = getCharacterFrames(character, size);
            for (let path of paths) {
                loader.add(`${character.name}-${paths.indexOf(path)}`, path);
            }
        }
        loader.once('complete', resolve);
        loader.load();
    });
}

function resizeScreen() {
    let screenSizer = setup.initialize();
}

$(window).resize(_.debounce(resizeScreen, 300));


$(document).ready(function() {
    let screenSizer = setup.initialize();
    var loadCharacters = fetchImages(screenSizer);
    loadCharacters.then(function (l) {
        console.log(l)
    })
});
//        return new Promise(function(resolve, reject) {
//            let name;
//            let images = [];
//
//            for (let asset in loader.resources) {
//                if (!name) name = asset.split('-')[0];
//                if (loader.resources[asset].isImage) {
//                    images.push({
//                        num: asset.split('-')[1],
//                        data: loader.resources[asset].data
//                    });
//                }
//            }
//            let profile = loader.resources[`${name}-profile`].data;
//
//            let textures = images.map(image => {
//                return {
//                    texture: new PIXI.BaseTexture(image.data),
//                    frame: image.num
//                }
//            });
//
//            // Build sequences
//            let sequences = {};
//            for (let prop in profile) {
//                if (typeof profile[prop] === 'object') {
//                    sequences[prop] = textures.filter(tex => {
//                        return profile[prop].start <= Number(tex.frame) && Number(tex.frame) < profile[prop].stop;
//                    }).map(tex => {
//                        return new PIXI.Texture(tex.texture)
//                    })
//                }
//            }
//            resolve(new PIXI.AnimatedSprite(sequences, 16))
//        });
//    }).then(function(sprite) {
//        let screenSizer = setup.initialize();
//        let renderer = PIXI.autoDetectRenderer(screenSizer.width, screenSizer.height);
//        document.body.appendChild(renderer.view);
//        let stage = new PIXI.Container();
//        sprite.anchor.x = .5;
//        sprite.anchor.y = .5;
//        sprite.position.x = screenSizer.width / 2;
//        sprite.position.y = screenSizer.height / 2;
//        sprite.interactive = true;
//        sprite.on('mouseover', function() {
//            console.log('hovering');
//            sprite.gotoAndPlay('hover')
//        });
//        sprite.on('click', function() {
//            console.log('clicking');
//            sprite.gotoAndPlay('click');
//        });
//        stage.addChild(sprite);
//        animate();
//        //renderer.render(stage)
//        function animate() {
//            //console.log('animating');
//            requestAnimationFrame(animate);
//            renderer.render(stage)
//        }
//    })
//});