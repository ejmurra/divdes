'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var graphics = require('gm').subClass({ imageMagick: true });
var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
require('babel-polyfill');

var SIZES = [480, 960, 1920];
var CHARS = ['tayo', 'chineze', 'jeremy', 'shareefah', 'maya', 'alma', 'donovan', 'kyra'];
var BASEPATH = path.resolve(path.dirname(require.main.filename), '../');

// Returns an object with all info needed to resize the character
function initializeCharacter(char) {
  var charPath = BASEPATH + '/public/characters/' + char + '/';
  var originalPath = BASEPATH + '/public/characters/' + char + '/frames/originals/*.png';
  var originals = glob.sync(originalPath);
  var numFrames = new Set();
  for (var i = 0; i < originals.length; i++) {
    numFrames.add(i + 1);
  }

  function missing() {
    var report = {};

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      var _loop = function _loop() {
        var size = _step.value;

        var searchString = charPath + 'frames/' + size + '/*.png';
        var completedFrames = glob.sync(searchString);
        //let completedFrames = ['x/1.png','x/2.png','x/3.png'];
        completedFrames = completedFrames.map(function (p) {
          p = p.split('/')[p.split('/').length - 1];
          return Number(p.split('.')[0]);
        });
        completedFrames = new Set(completedFrames);

        var difference = new Set([].concat(_toConsumableArray(numFrames)).filter(function (x) {
          return !completedFrames.has(x);
        }));
        report[String(size)] = Array.from(difference);
      };

      for (var _iterator = SIZES[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var completedFrames;

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

    return report;
  }

  return {
    name: char,
    missing: missing(),
    framePath: BASEPATH + '/public/characters/' + char + '/frames/'
  };
}

CHARS = CHARS.map(function (name) {
  return initializeCharacter(name);
});

function createMissingDirs(char) {
  // Set up dirs
  var dirs = glob.sync(char.framePath + '*');

  var buckets = dirs.map(function (p) {
    return p.split('/')[p.split('/').length - 1];
  });
  buckets = new Set(buckets);
  var o = new Set(SIZES);
  // get the difference
  var needDirs = [].concat(_toConsumableArray(o)).filter(function (x) {
    return !buckets.has(x);
  });
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = needDirs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var dir = _step2.value;

      fs.ensureDir(char.framePath + '/' + dir);
    }
    // copy over originals
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

  if (!buckets.has('3840')) {
    fs.copySync(char.framePath + 'originals', char.framePath + '/3840');
  }
  return Array.from(needDirs);
}

function getDestinationPath(char, image, size) {
  var output = char.framePath + size + image.split('/')[image.split('/').length - 1];
}

// graphicsMagik processing

var _iteratorNormalCompletion3 = true;
var _didIteratorError3 = false;
var _iteratorError3 = undefined;

try {
  var _loop2 = function _loop2() {
    var char = _step3.value;

    var toProcessSizes = createMissingDirs(char);
    var images = glob.sync(char.framePath + '/originals/**/*.png');
    var frameNums = images.map(function (p) {
      return p.split('/')[p.split('/').length - 1].split('.')[0];
    });

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      var _loop3 = function _loop3() {
        var image = _step4.value;
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          var _loop4 = function _loop4() {
            var size = _step5.value;

            var destination = char.framePath + size + '/' + image.split('/')[image.split('/').length - 1];
            graphics(image).resize(size).write(destination, function (err) {
              if (err) throw new Error(err);
              if (Math.pow(images.length, toProcessSizes.length) == Math.pow(images.indexOf(image) + 1, toProcessSizes.indexOf(size))) {
                console.log('finished');
                process.exit(0);
              }
            });
          };

          for (var _iterator5 = toProcessSizes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            _loop4();
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      };

      for (var _iterator4 = images[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        _loop3();
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  };

  for (var _iterator3 = CHARS[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
    _loop2();
  }
} catch (err) {
  _didIteratorError3 = true;
  _iteratorError3 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion3 && _iterator3.return) {
      _iterator3.return();
    }
  } finally {
    if (_didIteratorError3) {
      throw _iteratorError3;
    }
  }
}