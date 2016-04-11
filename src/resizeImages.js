let graphics = require('gm').subClass({imageMagick: true});
let fs = require('fs-extra');
let path = require('path');
let glob = require('glob');
let _ = require('lodash');
require('babel-polyfill');

let SIZES = [480, 960, 1920];
let CHARS = [
  'tayo',
  'chineze',
  'jeremy',
  'shareefah',
  'maya',
  'alma',
  'donovan',
  'kyra'
];
let BASEPATH = path.resolve(path.dirname(require.main.filename), '../');

// Returns an object with all info needed to resize the character
function initializeCharacter(char) {
  let charPath = `${BASEPATH}/public/characters/${char}/`;
  let originalPath = `${BASEPATH}/public/characters/${char}/frames/originals/*.png`;
  let originals = glob.sync(originalPath);
  let numFrames = new Set();
  for (let i = 0; i < originals.length; i++) {
    numFrames.add(i + 1);
  }

  function missing() {
    let report = {};

    for (let size of SIZES) {
      let searchString = `${charPath}frames/${size}/*.png`;
      let completedFrames = glob.sync(searchString);
      //let completedFrames = ['x/1.png','x/2.png','x/3.png'];
      completedFrames = completedFrames.map(function (p) {
        p = p.split('/')[p.split('/').length - 1];
        return Number(p.split('.')[0])
      });
      var completedFrames = new Set(completedFrames);

      let difference = new Set(
        [...numFrames].filter(x => !completedFrames.has(x))
      );
      report[String(size)] = Array.from(difference)

    }

    return report;
  }

  return {
    name: char,
    missing: missing(),
    framePath: `${BASEPATH}/public/characters/${char}/frames/`
  }
}

CHARS = CHARS.map(function (name) {
  return initializeCharacter(name);
});

function createMissingDirs(char) {
  // Set up dirs
  const dirs = glob.sync(`${char.framePath}*`);

  let buckets = dirs.map(function (p) {
    return p.split('/')[p.split('/').length - 1];
  });
  buckets = new Set(buckets);
  let o = new Set(SIZES);
  // get the difference
  let needDirs = [...o].filter(x => !buckets.has(x));
  for (let dir of needDirs) {
    fs.ensureDir(`${char.framePath}/${dir}`)
  }
  // copy over originals
  if (!buckets.has('3840')) {
    fs.copySync(`${char.framePath}originals`, `${char.framePath}/3840`)
  }
  return Array.from(needDirs);
}

function getDestinationPath(char, image, size) {
  let output = char.framePath + size + image.split('/')[image.split('/').length - 1];

}

// graphicsMagik processing

for (let char of CHARS) {
  let toProcessSizes = createMissingDirs(char);
  let images = glob.sync(`${char.framePath}/originals/**/*.png`);
  let frameNums = images.map(function (p) {
    return p.split('/')[p.split('/').length - 1].split('.')[0]
  });

  for (let image of images) {
    for (let size of toProcessSizes) {
      let destination = char.framePath + size + '/' + image.split('/')[image.split('/').length - 1];
      graphics(image)
        .resize(size)
        .write(destination, function (err) {
          if (err) throw new Error(err);
          if (Math.pow(images.length, toProcessSizes.length) ==
            Math.pow(images.indexOf(image) + 1, toProcessSizes.indexOf(size))) {
            console.log('finished');
            process.exit(0);
          }

        })
    }
  }
}