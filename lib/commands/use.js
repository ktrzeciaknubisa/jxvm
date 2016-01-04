// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
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

  var copied = jxtools.fs.copyExecutableSync(fname, dst);
  if (copied.err)
    return cb(copied.err);

  jxtools.readBinaryInfo(dst, function (info) {
    input.caption = info.caption || ("JXcore " + input.uniqueSID);
    // also save caption
    db.setConfig("current", input.uniqueSID);
    cb();
    common.newConsole(info.which);
  });
};


var download = function(input, cb) {

  jxtools.http.downloadJXcore(input.version, input.engine, input.arch, function(err, jxFile, ret) {
    if (err)
      return cb(err);

    var info = jxtools.http.getDownloadPackageInfo(ret.version, input.engine, input.arch);

    var r = jxtools.fs.copyExecutableSync(jxFile, path.join(common.homeDir, ret.basename));
    if (r.err)
      return cb(r.err);

    var r = jxtools.fs.moveExecutableSync(jxFile, common.jxPath);
    if (r.err)
      return cb(r.err);

    cb(null);
  });
};


var checkLocal = function(ret, cb) {

  var cachedJXPath = path.join(common.homeDir, ret.basename);
  if (fs.existsSync(cachedJXPath)) {
    var r = jxtools.fs.copyExecutableSync(cachedJXPath, common.jxTargetPath);
    if (r.err)
      return cb(r.err);
    else {
      jxtools.console.logPair("JXcore successfully switched to", ret.basename, "yellow");
      return cb();
    }
  }


};


exports.run = function (input, cb) {

  var argv = common.parsedArgv;
  var ver = input.version || argv.use.value;
  var testInt = ver === 'latest' ? 1 : parseInt(ver);

  if (!ver || argv.help || isNaN(testInt))
    return cb("Please provide valid version number.");


  if (ver === 'latest') {
    jxtools.http.getLatestInfo(function(err, ret) {
      if (err)
        return cb(err);

      checkLocal(ret, cb);
    });
  } else {
    var info = jxtools.http.getDownloadPackageInfo(ver, input.engine, input.arch);
    checkLocal(info, cb)
  }
};