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
            loader.add(`${character.name}-profile`, `./characters/${character.name}/profile.json`);
        }

        loader.once('complete', resolve);
        loader.load();
    });
}

//function resizeScreen() {
//    let screenSizer = setup.initialize();
//}
//
//$(window).resize(_.debounce(resizeScreen, 300));

function checkContents(x) {
    console.log(x);
}

function organizeLoaderResources(loader) {
    let background = [];
    let chars = {};
    for (let asset in loader.resources) {
        if (asset.slice(0,2) == 'bg') {
            background.push({
                layer: asset.split('-')[1],
                data: loader.resources[asset].data
            })
        } else {
            let name = asset.split('-')[0];
            let availNames = Object.keys(chars);
            if (availNames.indexOf(name) === -1) {
                chars[name] = [];
            }
            chars[name].push(loader.resources[asset]);
        }
    }
    return {background, chars, loader};
}

function createBackgroundManager(background) {
    let _layers = background.map(layer => {
        return {
            layer: +layer.layer,
            sprite: new PIXI.extras.TilingSprite(new PIXI.Texture(new PIXI.BaseTexture(layer.data)), layer.data.width, layer.data.height)
        }
    }).map(layer => {
        // TODO: initialize position and anchoring values;
        return layer;
    });
    return {
        _layers,
        moveRight(num) {
            _layers.map(layer => {
                layer.sprite.tilePosition += (num * (layer.layer + 1));
            })
        },
        moveLeft(num) {
            _layers.map(layer => {
                layer.sprite.tilePosition -= (num * (layer.layer + 1));
            })
        },
        addToStage(stage) {
            _layers.sort((a, b) => {
                return a.layer < b.layer ? -1 : 1;
            }).map(layer => {
                stage.addChild(layer.sprite);
            });
        }
    };
}

function reversed(array) {
    let newArray = [];
    for (let i = array.length - 1; i >= 0; i--) {
        newArray.push(array[i])
    }
    return newArray;
}

function createTexturesFromImages({background, chars, loader}) {
    let sprites = [];
    for (let char in chars) {
        let profile = loader.resources[`${char}-profile`].data;
        let textures = chars[char].filter(image => {
            return image.name.split('-')[1] !== 'profile'
        }).map(image => {
            return {
                texture: new PIXI.BaseTexture(image.data),
                frame: +image.name.split('-')[1]
            }
        });
        let sequences = {};
        for (let animation in profile) {
            if (typeof profile[animation] === 'object') {
                sequences[animation] = textures.filter(tex => {
                    return profile[animation].start <= Number(tex.frame) && Number(tex.frame) < profile[animation].stop;
                }).sort((a, b) => {
                    return a.frame < b.frame ? -1 : 1;
                }).map(tex => {
                    return new PIXI.Texture(tex.texture)
                });
                sequences[`reverse-${animation}`] = reversed(sequences[animation]);
            }
        }
        sprites.push({
            sprite: new PIXI.AnimatedSprite(sequences, 16),
            video: profile.video
        })
    }
    let backgroundManager = createBackgroundManager(background);
    return {sprites, backgroundManager};
}

function addSpriteToStage(sprite, stage) {
    sprite.sprite.anchor.x = sprite.sprite.anchor.y = .5;
    sprite.sprite.position.x = window.innerWidth / 2;
    sprite.sprite.position.y = window.innerHeight / 2;
    sprite.sprite.interactive = true;
    sprite.sprite._animationState = 'hover';
    sprite.sprite.on('mouseover', function() {
        sprite.sprite.gotoAndPlay('hover');
        sprite.sprite._animationState = 'hover';
    });
    let video = null;
    sprite.sprite.on('click', function() {
        if (sprite.sprite._animationState === 'hover') {
            sprite.sprite.gotoAndPlay('click');
            setTimeout(function() {
                video = new PIXI.Sprite(new PIXI.Texture.fromVideoUrl(sprite.video));
                video.anchor. x = video.anchor.y = .5;
                video.position.x = window.innerWidth / 2;
                video.position.y = window.innerHeight / 2;
                stage.addChild(video);
            }, 1200);
            sprite.sprite._animationState = 'clicked';
        } else if (sprite.sprite._animationState === 'clicked') {
            sprite.sprite.gotoAndPlay('reverse-click');
            sprite.sprite._animationState = 'hover';
            stage.removeChild(video);
            video.destroy();
        }
    });
    //sprite.on('mouseout', function() {
    //    sprite.gotoAndPlay('reverse-hover');
    //});
    stage.addChild(sprite.sprite);
}




function renderScene({sprites, backgroundManager}) {
    let renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.view);
    let stage = new PIXI.Container();
    backgroundManager.addToStage(stage);
    addSpriteToStage(sprites[0], stage);
    animate();
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(stage);
    }
}

//then(function(sprite) {
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

$(document).ready(function() {
    let screenSizer = setup.initialize();
    var loadCharacters = fetchImages(screenSizer);
    loadCharacters
        .then(organizeLoaderResources)
        .then(createTexturesFromImages)
        .then(renderScene)
});