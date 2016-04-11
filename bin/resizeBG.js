'use strict';

var graphics = require('gm').subClass({ imageMagick: true });
var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
require('babel-polyfill');

var SIZES = [480, 960, 1920, 3840];
var IMGPATH = path.resolve(path.dirname(require.main.filename), '../public/bg/originals/');

var images = glob.sync(IMGPATH + '/**/*.png');

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    var _loop = function _loop() {
        var size = _step.value;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            var _loop2 = function _loop2() {
                var image = _step2.value;

                fs.ensureDir(path.resolve(path.dirname(require.main.filename), '../public/bg/' + size), function () {
                    graphics(image).resize(size).write(path.resolve(path.dirname(require.main.filename), '../public/bg/' + size + '/' + image.split('/')[image.split('/').length - 1]), function () {});
                });
            };

            for (var _iterator2 = images[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                _loop2();
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
    };

    for (var _iterator = SIZES[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        _loop();
    }
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally {
    try {
        if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
        }
    } finally {
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}