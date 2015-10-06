// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var db = require("../db.js");
var help = require("./help.js");
var download = require("../download.js");

var jxtools = require('jxtools');
var fs = require("fs");
var path = require("path");

var useLocal = function (input, cb) {

  var current = db.getConfig("current");
  if (current === input.uniqueSID) {
    jxtools.console.logPair("JXcore is already switched to", input.caption, "yellow");
    return cb(null, true);
  }

  var fname = path.join(input.localDir, common.jxName);
  var dst = path.join(common.dirJXVM, common.jxName);

  var copied = common.copyExecutableSync(fname, dst);
  if (copied.err)
    return cb(copied.err);

  common.readBinaryInfo(dst, function (info) {
    input.caption = info.caption || ("JXcore " + input.uniqueSID);
    // also save caption
    db.setConfig("current", input.uniqueSID);
    cb();
    common.newConsole(info.which);
  });
};

exports.run = function (input, cb) {

  var _cb = function (err, skip) {

    if (!err && !skip)
      jxtools.console.logPair("JXcore successfully switched to", input.caption, "yellow");

    if (cb)
      cb(err);
  };

  var argv = common.parsedArgv;
  var ver = input.version || argv.use.value;
  if (!ver)
    return help.displayCommandUsage("use", "Please provide version number.");

  if (ver === "help")
    return help.displayCommandUsage("use");

  common.init();

  var _continue = function () {
    var v = db.versions[input.uniqueSID];
    if (v && !argv.force) {
      input = v;
      var fname = path.join(input.localDir, common.jxName);
      if (fs.existsSync(fname))
        return useLocal(input, _cb);
    }

    //download
    download.download(input, function (err, file) {
      if (err)
        return _cb(err);

      var unzipper = new jxtools.zip.Unzipper();

      unzipper.on('end', function (err) {
        if (err) {
          return _cb(err);
        } else {
          db.addEntry(input);

          try {
            fs.unlinkSync(file);
          } catch (ex) {
          }

          return useLocal(input, _cb);
        }
      });

      unzipper.unzip(file, input.localDir);

    });
  };

  var version = input.version;

  if (input.version !== "latest") {
    var testInt = parseInt(version);
    if (isNaN(testInt))
      return help.displayCommandUsage("use", "Unrecognized version number.");

    _continue();
  } else {
    download.getLatestInfo(function (err, info) {
      // info is e.g.: { urlPath: 'https://jxcore.s3.amazonaws.com/0304', version: 'Beta-0.3.0.4' }
      if (err)
        return _exit(err);

      var norm = common.normalizeVersion(info.version);
      common.parsedArgv.use.value = norm;
      input = common.getUserInput();

      _continue();
    });
  }

};