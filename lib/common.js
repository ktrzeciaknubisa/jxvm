// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var util = require("util");

var db = require("./db.js");
var jx_argv = require("./jx_argv.js");
var jx_utils = require("./jx_utils.js");
var console = jx_utils.console;
exports.console = jx_utils.console;

var parsedArgv = null;
exports.parsedArgv = null;

var parse = function () {
  var special = ["help", "use", "init"];
  var argv2 = process.argv[2];

  for (var a = 0, len = special.length; a < len; a++) {
    if (argv2 === special[a]) {
      // for easier argv parsing
      process.argv[2] = "--" + argv2;
      break;
    }
  }

  parsedArgv = jx_argv.parse({force: true});
  exports.parsedArgv = parsedArgv;
}();

exports.isInstalled = path.basename(require.main.filename) === "jxvm.bin.js";
exports.isWindows = process.platform === "win32";
exports.dirVersions = path.join(__dirname, "..", "versions");


exports.normalizeVersion = function (versionString) {

  if (!versionString)
    return "";

  v = versionString.replace(/\.|v|-|\s|beta/gi, "");
  while (v.slice(0, 1) === "0")
    v = v.slice(1);

  if (v.length === 3)
    v = "0" + v;

  return v;
};

// takes version from process.argv when called e.g.: jxvm use 237
exports.getDesiredVersion = function () {
  if (!parsedArgv.use || !parsedArgv.use.value)
    return null;

  return exports.normalizeVersion(parsedArgv.use.value);
};

// takes engine from process.argv
exports.getDesiredEngine = function () {

  var ret = "";

  if (parsedArgv.sm) ret = "sm";
  if (parsedArgv.v8) ret = "v8";

  var v = exports.getDesiredVersion();
  if (v == "0237" && ret) {
    console.warn("This version doesn't support multiple engines. Just V8.")
    ret = "v8";
  }

  // default is V8
  return ret || "v8";
};

exports.normalizeArchitecture = function(archString) {

  if (archString)
    archString = archString.replace(/x|ia/gi, "");

  if (archString === "32" || archString === "64")
    return archString;

  return process.arch.replace(/x|ia/gi, "");
};

// gets arch from process.argv
exports.getDesiredArchitecture = function () {
  return exports.normalizeArchitecture(
    parsedArgv.ia32 || parsedArgv.x32 || parsedArgv["32"] ||
    parsedArgv.x64 || parsedArgv["64"]);
};


// returns e.g. jx_0304osx64v8
exports.getUniqueSID = function(version, arch, engine, osStr) {

  if (!osStr)
    osStr = jx_utils.OSInfo().fullName.split("-")[0].toLowerCase();

  return "jx_" + exports.normalizeVersion(version) + osStr + exports.normalizeArchitecture(arch) + engine;
};

// returns e.g. jx_osx64v8
exports.getBasename = function(version, arch, engine, osStr) {

  if (!osStr)
    osStr = jx_utils.OSInfo().fullName.split("-")[0].toLowerCase();

  if (exports.normalizeVersion(version) == "0237")
    engine = "";

  return "jx_" + osStr + exports.normalizeArchitecture(arch) + engine;
};


exports.getUserInput = function (version, arch, engine) {
  var ret = {
    "version": version ? exports.normalizeVersion(version) : exports.getDesiredVersion(),
    "engine": engine || exports.getDesiredEngine(),
    "arch": arch ? exports.normalizeArchitecture(arch) : exports.getDesiredArchitecture()
  };

  ret.basename = exports.getBasename(exports.getDesiredVersion(), exports.getDesiredArchitecture(), exports.getDesiredEngine());

  if (ret.version === "0237") {
    ret.url = "https://s3.amazonaws.com/nodejx/" + ret.basename + ".zip";
  } else {
    ret.url = "https://jxcore.s3.amazonaws.com/" + ret.version + "/" + ret.basename + ".zip";
  }

  ret.uniqueSID = exports.getUniqueSID(ret.version, ret.arch, ret.engine);
  ret.localDir = path.join(__dirname, "../versions/", ret.uniqueSID);

  return ret;
};

exports.logPair = function (first, second, color) {
  first = console.setColor(first + ":", "cyan");
  if (second === "Done")
    color = "green";
  if (color)
    second = console.setColor(second, color);
  console.log(first, second)
};


exports.clearLineAbove = function () {
  var cursorUp = "\033[1A";
  var clearLine = "\033[K";
  console.write(cursorUp + clearLine);
};


exports.logErrorAndExit = function () {
  console.error.apply(null, arguments);
  process.exit();
};


// each command is { name : something", command : "uname -a" }
exports.execMultiple = function (commands, cb) {

  if (!util.isArray(commands))
    commands = commands[commands];

  var ret = {};

  var next = function () {
    var _cmd = commands.shift();

    if (!_cmd)
      return cb(ret);

    cp.exec(_cmd.command, {timeout: 1000}, function (error, stdout, stderr) {
      if (!error) {
        ret[_cmd.name] = stdout.toString().trim();
      } else {
        ret[_cmd.name] = {err: error.toString().trim()};
      }
      process.nextTick(next);
    });
  };

  next();
};

exports.readBinaryInfo = function (jxPath, cb) {
  var cmd = [];
  cmd.push({name: "jxv", command: '"' + jxPath + '" -jxv'});
  cmd.push({name: "arch", command: '"' + jxPath + '" -p process.arch'});
  cmd.push({name: "jsv", command: '"' + jxPath + '" -jsv'});
  cmd.push({name: "engine", command: '"' + jxPath + '" -p "process.versions.sm ? \'sm\' : \'v8\'"'});

  var ret = {err: false};
  ret.caption = "";

  exports.execMultiple(cmd, function (ret) {
    for (var o in ret) {
      if (ret[o].err && ret[o].err.toString("unrecognized flag") !== -1) {
        // remove errors with unrecognized flag (older jx version may not support e.g. -jsv)
        ret[o] = "";
      }
    }

    ret.caption = "";
    if (ret.jxv) ret.caption = "JXcore " + ret.jxv;
    if (ret.arch) ret.caption += ", " + ret.arch;
    if (ret.jsv) ret.caption += ", " + ret.jsv;
    cb(ret);
  });
};


exports.copySync = function(src, dst, mode) {
  try {
    fs.writeFileSync(dst, fs.readFileSync(src));
  } catch (ex) {
    return { err : "Cannot copy file from '" + src + "' to '" + dst + "'.\n" + ex };
  }

  if (mode) {
    try {
      fs.chmod(dst, 0755);
    } catch (ex) {
      return { err : "Cannot chmod -755 copied jx: " + dst  +".\n" + ex };
    }
  }

  return true;
};