// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var console = common.console;
var help = require("./help.js");
var cp = require("child_process");
var os = require("os");
var fs = require("fs");
var path = require("path");


// this target is linked with /us/local/bin/jxx
// and other initialized with `jxsm init name`
var targetJX = path.join(__dirname, "../../bin/jx");


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


var findPaths = function (cb) {

  var cmds = [];
  cmds.push({name: "where_jx", command: common.isWindows ? "where jx" : "which jx"});
  cmds.push({name: "where_jxvm", command: common.isWindows ? "where jxvm" : "which jxvm"});
  cmds.push({name: "where_jxx", command: common.isWindows ? "where jxx" : "which jxx"});

  var linkCreated = false;
  var alreadyLinked = false;

  common.execMultiple(cmds, function (ret) {

    console.log(ret, "yellow");

    if (ret["where_jxvm"].err || !ret["where_jxvm"])
      return cb("Cannot find jxvm in system PATH. Try reinstalling jxvm.");

    if (ret["where_jxx"].err || !ret["where_jxx"])
      return cb("Cannot find jxx in system PATH. Try reinstalling jxvm.");

    var dir = path.dirname(ret["where_jxvm"]);
    var name = common.parsedArgv.init.value;
    var file = common.isWindows ? path.join(dir, name + ".cmd") : path.join(dir, name);
    var jxx = ret["where_jxx"];
    var newName = path.join(dir, name);

    console.info(name, dir, file);
    if (fs.existsSync(file)) {
      var stat = fs.lstatSync(file);
      console.warn("stat", stat.size);
      if (!common.isWindows && stat.size < 1024 && stat.isSymbolicLink())
        alreadyLinked = true;

      if (name !== "jx")
       return cb("Cannot use `" + name + "` name. The file already exists: " + file);
    }

    if (!ret["where_jx"].err && ret["where_jx"]) {
      // found some jx binaries. let's copy them to versions folder
      // there may be few of them
      var arr = ret["where_jx"].split(os.EOL);
      console.log("Arr", arr, "yellow");
      var len = arr.length;
      var cnt = 0;

      for (var o in arr) {

        var _path = arr[o].trim();
        if (!fs.existsSync(_path)) {
          console.error("_path does not exist?");
          continue;
        }

        common.readBinaryInfo(_path, function (info) {
          var input = common.getUserInput(info.jxv, info.arch, info.engine);

          if (!fs.existsSync(input.localDir)) {
            try {
              fs.mkdirSync(input.localDir);
            } catch(ex) {
              return cb("Cannot create directory: " + input.localDir + "\n" + ex);
            }
          }

          // copying jx binary from PATH to versions
          var localJX = path.join(input.localDir, "jx");
          var copied = common.copySync(_path, localJX);

          if (copied.err)
            return cb(copied.err);

          if (linked) return;

          // copying jx binary from target /bin/jx
          var copied = common.copySync(_path, targetJX);

          if (copied.err)
            return cb(copied.err);

          linked = link(jxx, newName);
          if (linked.err)
            return cb(linked.err);

          cnt++;
          if (cnt === len)
            return cb()
          //console.info("_path", _path, info);
        });
      }
    } else {
      // jx was not found
      var linked = link(jxx, newName);
      if (linked.err)
        return cb(linked.err);
    }


    //common.readBinaryInfo()
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


  var uid = process.getuid();
  //console.log("process.getuid()", uid, argv.init);

  if (common.isWindows) {

  } else {

    if (uid !== 0)
      return cb("This command needs to be executed with sudo.");
  }

  findPaths(function (err) {
    cb(err);
    if (!err)
      console.info("ok");
  });

  //var cmd = common.isWindows ? "where" : "which";
  //cmd += " jx";
  //
  //cp.exec(cmd, function(error, stdout, stderr) {
  //  if (error)
  //    return cb(error.toString());
  //
  //  //console.warn("Error", cmd, "\n", error, stdout + "", stderr + "");
  //  common.readBinaryInfo("/usr/local/bin/jx", function(info) {
  //    //console.info(info);
  //    findPaths();
  //  });
  //});

};