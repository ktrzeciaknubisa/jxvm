// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var db = require("../db.js");
var help = require("./help.js");
var download = require("../download.js");
var jx_utils = require("../jx_utils.js");
var console = jx_utils.console;

var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var useLocal = function (input, cb) {

  var current = db.getConfig("current");
  if (current === input.uniqueSID) {
    common.logPair("The `jxx` is already switched to", input.caption, "yellow");
    return cb(null, true);
  }

  var dst = path.join(__dirname, "../../bin/jx");
  var fname = path.join(input.localDir, "jx");

  if (common.isInstalled) {
    try {
      fs.writeFileSync(dst, fs.readFileSync(fname));
    } catch (ex) {
      return cb("Cannot switch version: " + ex);
    }

    try {
      fs.chmod(dst, 0755);
    } catch (ex) {
      return cb("Cannot chmod: " + ex);
    }
  }

  var cmd = [];
  cmd.push('"' + fname + '" -jxv');
  cmd.push('"' + fname + '" -a');
  cmd.push('"' + fname + '" -jsv');

  input.caption = "";
  var outputs = [];

  var next = function() {
    var _cmd = cmd.shift();

    if (!_cmd) {
      input.caption = "JXcore " + (outputs.join(", ") || input.uniqueSID);
      // also save caption
      db.setConfig("current", input.uniqueSID);
      return cb();
    }

    cp.exec(_cmd, { timeout : 1000 }, function (error, stdout, stderr) {
      if (!error)
        outputs.push(stdout.toString().trim());
      process.nextTick(next);
    });
  };

  next();
};

exports.run = function (input, cb) {

  var _cb = function (err, skip) {

    if (!err && !skip)
      common.logPair("The `jxx` successfully switched to", input.caption, "yellow");

    if (cb)
      cb(err);
  };

  var argv = common.parsedArgv;
  if (!argv.use.value)
    return help.displayCommandUsage("use", "Please provide version number.");

  if (argv.use.value === "help")
    return help.displayCommandUsage("use");

  var version = common.getDesiredVersion();
  var testInt = parseInt(version);
  if (isNaN(testInt))
    return help.displayCommandUsage("use", "Unrecognized version number.");

  var v = db.versions[input.uniqueSID];
  if (v && !argv.force) {
    input = v;
    var fname = path.join(input.localDir, "jx");
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