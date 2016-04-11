let graphics = require('gm').subClass({imageMagick: true});
let fs = require('fs-extra');
let path = require('path');
let glob = require('glob');
let _ = require('lodash');
require('babel-polyfill');


let SIZES = [480,960,1920, 3840];
let IMGPATH = path.resolve(path.dirname(require.main.filename),'../public/bg/originals/');

let images = glob.sync(`${IMGPATH}/**/*.png`);

for (let size of SIZES) {
    for (let image of images) {
        fs.ensureDir(path.resolve(path.dirname(require.main.filename),`../public/bg/${size}`), function() {
            graphics(image)
            .resize(size)
            .write(path.resolve(path.dirname(require.main.filename),`../public/bg/${size}/${image.split('/')[image.split('/').length - 1]}`),function(){})
        })
    }
}