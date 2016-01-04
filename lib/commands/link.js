// Copyright & License details are available under JXCORE_LICENSE file

var common = require('../common.js');
var fs = require('fs');
var path = require('path');
var jxtools = require('jxtools');

var runUnix = function (input, cb) {

  var jx = '/usr/local/bin/jx';

  // creating a backup
  if (fs.existsSync(jx)) {
    var backup = path.join(common.dirJXcoreSystem, 'jx');
    var copied = jxtools.fs.copyExecutableSync(jx, backup);
    if (copied.err)
      return cb(copied.err);

    if (!fs.existsSync(common.jxPath)) {
      var copied = jxtools.fs.copyExecutableSync(jx, backup);
      if (copied.err)
        return cb(copied.err);
    }

    try {
      fs.unlinkSync(jx);
    } catch (ex) {
      return cb('Cannot remove current ' + jx + '. Try sudo.\n' + ex);
    }
  }

  var fake = false;
  if (!fs.existsSync(common.jxPath)) {
    fake = true;
    fs.writeFileSync(common.jxPath, '');
  }

  try {
    fs.symlinkSync(common.jxPath, jx);
  } catch (ex) {
    if (fake)
      fs.unlinkSync(common.jxPath);
    return cb('Cannot link ' + jx + ' to ' + common.jxPath + '. Try sudo.\n' + ex);
  }

  if (fake)
    fs.unlinkSync(common.jxPath);
};

exports.run = function (input, cb) {

  if (!common.isWindows)
    runUnix(input, cb);

};