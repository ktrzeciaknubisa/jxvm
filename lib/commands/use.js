// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var db = require("../db.js");
var help = require("./help.js");
var download = require("../download.js");
var console = common.console;

var fs = require("fs");
var path = require("path");

var useLocal = function (input, cb) {

  //console.info("uselocal", input);
  //var current = db.getConfig("current");
  //if (current === input.uniqueSID) {
  //  common.logPair("JXcore is already switched to", input.caption, "yellow");
  //  return cb(null, true);
  //}

  var dst = path.join(__dirname, "../../bin/", common.jxName);
  var fname = path.join(input.localDir, common.jxName);

  try {
    fs.chmod(fname, 0755);
  } catch (ex) {
    return cb("Cannot chmod: " + ex);
  }

  if (common.isInstalled) {
    // copy only when package is installed
    // not to override dev version
    try {
      fs.writeFileSync(dst, fs.readFileSync(fname));
    } catch (ex) {
      return cb("Cannot switch version: " + ex);
    }
  }

  common.readBinaryInfo(fname, function (info) {
    input.caption = info.caption || ("JXcore " + input.uniqueSID);
    // also save caption
    db.setConfig("current", input.uniqueSID);
    return cb();
  });
};

exports.run = function (input, cb) {
  //console.warn(input);
  var _cb = function (err, skip) {

    if (!err && !skip)
      common.logPair("JXcore successfully switched to", input.caption, "yellow");

    if (cb)
      cb(err);
  };

  var argv = common.parsedArgv;
  if (!argv.use.value)
    return help.displayCommandUsage("use", "Please provide version number.");

  if (argv.use.value === "help")
    return help.displayCommandUsage("use");


  var _continue = function () {
    var v = db.versions[input.uniqueSID];
    if (v && !argv.force) {
      input = v;
      var fname = path.join(input.localDir, common.jxName);
      if (fs.existsSync(fname))
        return useLocal(input, _cb);
    }

    //download
    download.download(input, function (err) {
      if (err)
        return _cb(err);

      download.unzip(input, function (err) {
        if (err)
          return _cb(err);
        else
          return useLocal(input, _cb);
      });
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