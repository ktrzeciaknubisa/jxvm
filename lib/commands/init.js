// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var db = require("../db.js");
var console = common.console;
var help = require("./help.js");
var cp = require("child_process");
var os = require("os");
var fs = require("fs");
var path = require("path");


// this target is linked with /us/local/bin/jxx
// and other initialized with `jxsm init name`
var targetJX = path.join(__dirname, "../../bin/", common.jxName);


var link = function(src, dst) {

  try {
    // remove original jx prior copying
    if (fs.existsSync(dst))
      fs.unlinkSync(dst);
  } catch (ex) {
    return { err : "Cannot remove: " + dst + "\n" + ex };
  }

  if (!common.isWindows) {
    var src = targetJX;
    try {
      fs.symlinkSync(src, dst);
    } catch (ex) {
      return { err : "Cannot link: `" + dst + "` to `" + src + "`\n" + ex };
    }
  }

  return true;
};


var goUnix = function(ret, cb) {

  var dir = path.dirname(ret["where_jxvm"]);
  var name = common.parsedArgv.init.value;
  var newName = path.join(dir, name);
  var jxx = ret["where_jxx"];

  // are there any more commands in path/
  var where = ret["where_newName"].err ? "" : ret["where_newName"];
  where = where.trim();
  var arr = where ? where.split(os.EOL) : [];
  var index = arr.indexOf(newName);
  if (index === -1)
    arr.push(newName)

  var _finish = function(createLink, input, skip) {

    if (createLink) {
      var linked = link(jxx, newName);
      if (linked.err)
        return cb(linked.err);
    }

    if (arr.length > 1) {
      console.warn("Beware!");
      console.log("There are multiple commands with that name in PATH:");
      console.log(arr.join("\n"));
    }

    cb(false, input || null, skip);
  };

  //console.info("findPaths2", name, dir, newName);
  if (fs.existsSync(newName)) {
    var lstat = fs.lstatSync(newName);
    var stat = fs.statSync(newName);
    //console.warn("findPaths3", "stat", stat.size);
    if (lstat.isSymbolicLink() && fs.readlinkSync(newName) === targetJX) {
      common.logPair("Already linked as", name, "yellow");
      return _finish();
    };

    if (name !== "jx" && name !== common.jxName)
      return cb("Cannot use `" + name + "` name. The file already exists: " + newName);

    // reading info about previously installed jx
    common.readBinaryInfo(newName, function (info) {
      var input = common.getUserInput(info.jxv, info.arch, info.engine);

      if (!fs.existsSync(input.localDir)) {
        try {
          fs.mkdirSync(input.localDir);
        } catch(ex) {
          return cb("Cannot create directory: " + input.localDir + "\n" + ex);
        }
      }

      // copying jx binary from PATH to versions
      var localJX = path.join(input.localDir, path.basename(newName));
      var copied = common.copySync(newName, localJX);

      if (copied.err)
        return cb(copied.err);

      // copying jx binary from target /bin/jx
      var copied = common.copySync(newName, targetJX);

      if (copied.err)
        return cb(copied.err);

      return _finish(true, input);
    });
  } else {
    _finish(true);
  }

};


var goWindows = function(ret, cb) {
  var dir = path.dirname(ret["where_jxvm"]);
  var name = common.parsedArgv.init.value;
  var newName = path.join(dir, name);
  var jxx = ret["where_jxx"];

  // are there any more commands in path/
  var where = ret["where_newName"].err ? "" : ret["where_newName"];
  where = where.trim();
  var arr = where ? where.split(os.EOL) : [];
  var index = arr.indexOf(newName);
  if (index === -1)
    arr.push(newName)

  var _finish = function(createLink, input, skip) {

    if (createLink) {
      var linked = link(jxx, newName);
      if (linked.err)
        return cb(linked.err);
    }

    if (arr.length > 1) {
      console.warn("Beware!");
      console.log("There are multiple commands with that name in PATH:");
      console.log(arr.join("\n"));
    }

    cb(false, input || null, skip);
  };

  //console.info("findPaths2", name, dir, newName);
  if (fs.existsSync(newName)) {
    var lstat = fs.lstatSync(newName);
    var stat = fs.statSync(newName);
    //console.warn("findPaths3", "stat", stat.size);
    if (lstat.isSymbolicLink() && fs.readlinkSync(newName) === targetJX) {
      common.logPair("Already linked as", name, "yellow");
      return _finish();
    };

    if (name !== "jx" && name !== common.jxName)
      return cb("Cannot use `" + name + "` name. The file already exists: " + newName);

    // reading info about previously installed jx
    common.readBinaryInfo(newName, function (info) {
      var input = common.getUserInput(info.jxv, info.arch, info.engine);

      if (!fs.existsSync(input.localDir)) {
        try {
          fs.mkdirSync(input.localDir);
        } catch(ex) {
          return cb("Cannot create directory: " + input.localDir + "\n" + ex);
        }
      }

      // copying jx binary from PATH to versions
      var localJX = path.join(input.localDir, path.basename(newName));
      var copied = common.copySync(newName, localJX);

      if (copied.err)
        return cb(copied.err);

      // copying jx binary from target /bin/jx
      var copied = common.copySync(newName, targetJX);

      if (copied.err)
        return cb(copied.err);

      return _finish(true, input);
    });
  } else {
    _finish(true);
  }

};

var findPaths = function (cb) {

  var name = common.parsedArgv.init.value;

  var cmds = [];
  cmds.push({name: "where_newName", command: common.isWindows ? "where " + name : "which " + name});
  cmds.push({name: "where_jx", command: common.isWindows ? "where jx" : "which jx"});
  cmds.push({name: "where_jxvm", command: common.isWindows ? "where jxvm.cmd" : "which jxvm"});
  cmds.push({name: "where_jxx", command: common.isWindows ? "where jxx.cmd" : "which jxx"});

  common.execMultiple(cmds, function (ret) {

    //console.log("findPaths2", ret, "yellow");

    if (ret["where_jxvm"].err || !ret["where_jxvm"])
      return cb("Cannot find jxvm in system PATH. Try reinstalling jxvm.");

    if (ret["where_jxx"].err || !ret["where_jxx"])
      return cb("Cannot find jxx in system PATH. Try reinstalling jxvm.");

    if (common.isWindows)
      goWindows(ret, cb);
    else
      goUnix(ret, cb);
  });
};


exports.run = function (input, cb) {

  if (!common.isInstalled)
    return common.logErrorAndExit("This command is disabled for non-installed jxvm.");

  var argv = common.parsedArgv;
  if (!argv.init.value)
    return help.displayCommandUsage("init", "Please provide a name.");

  if (argv.init.value === "help")
    return help.displayCommandUsage("init");

  if (common.isWindows) {

  } else {
    var uid = process.getuid();
    //console.log("process.getuid()", uid, argv.init);

    if (uid !== 0)
      return cb("This command needs to be executed with sudo.");
  }

  findPaths(function (err, input, skip) {
    if (err)
      return cb(err);

    if (skip)
      common.logPair("Success! From now on you can use the following name", argv.init.value, "yellow");

    if (input) {
      db.addEntry(input);
      var use = require("./use.js");
      use.run(input, cb);
    } else {
      cb();
    }
  });

};