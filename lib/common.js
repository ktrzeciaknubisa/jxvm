// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var util = require("util");


exports.isInstalled = path.basename(require.main.filename) === "jxvm.bin.js";
exports.isWindows = process.platform === "win32";

var home = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
exports.dirJXVM = path.join(home, '.jxvm');
exports.dirVersions = path.join(home, '.jxvm/versions');
exports.dirJXcoreSystem = path.join(home, '.jxvm/versions/system');
exports.jxName = exports.isWindows ? "jx.exe" : "jx";
exports.jxPath = path.join(home, '.jxvm', exports.jxName);

var bash_profile = path.join(home, '.bash_profile');


var db = require("./db.js");
var jxtools = require('jxtools');
var common = require('./common.js');
var console = jxcore.utils.console;

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

  parsedArgv = jxcore.utils.argv.parse({force: true});
  exports.parsedArgv = parsedArgv;
}();

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
var getDesiredVersion = function () {
  if (!parsedArgv.use || !parsedArgv.use.value)
    return null;

  return exports.normalizeVersion(parsedArgv.use.value);
};

// takes engine from process.argv
var getDesiredEngine = function () {

  var ret = "";

  if (parsedArgv.sm) ret = "sm";
  if (parsedArgv.v8) ret = "v8";

  var v = getDesiredVersion();
  if (v == "0237" && ret) {
    console.warn("This version doesn't support multiple engines. Just V8.")
    ret = "v8";
  }

  // default is V8
  return ret || "v8";
};

var normalizeArchitecture = function (archString) {

  if (archString)
    archString = archString.replace(/x|ia/gi, "");

  if (archString === "32" || archString === "64")
    return archString;

  return process.arch.replace(/x|ia/gi, "");
};

// gets arch from process.argv
var getDesiredArchitecture = function () {
  return normalizeArchitecture(
    parsedArgv.ia32 || parsedArgv.x32 || parsedArgv["32"] ||
    parsedArgv.x64 || parsedArgv["64"]);
};


// returns e.g. jx_0304osx64v8
var getUniqueSID = function (version, arch, engine, osStr) {

  if (!osStr)
    osStr = jxcore.utils.OSInfo().fullName.split("-")[0].toLowerCase();

  return "jx_" + exports.normalizeVersion(version) + osStr + normalizeArchitecture(arch) + engine;
};

// returns e.g. jx_osx64v8
var getBasename = function (version, arch, engine, osStr) {

  if (!osStr)
    osStr = jxcore.utils.OSInfo().fullName.split("-")[0].toLowerCase();

  if (exports.normalizeVersion(version) == "0237")
    engine = "";

  return "jx_" + osStr + normalizeArchitecture(arch) + engine;
};


exports.getUserInput = function (version, arch, engine) {
  var ret = {
    "version": version ? exports.normalizeVersion(version) : getDesiredVersion(),
    "engine": engine || getDesiredEngine(),
    "arch": arch ? normalizeArchitecture(arch) : getDesiredArchitecture()
  };

  ret.basename = getBasename(getDesiredVersion(), getDesiredArchitecture(), getDesiredEngine());

  if (ret.version === "0237") {
    ret.url = "https://s3.amazonaws.com/nodejx/" + ret.basename + ".zip";
  } else {
    ret.url = "https://jxcore.s3.amazonaws.com/" + ret.version + "/" + ret.basename + ".zip";
  }

  ret.uniqueSID = getUniqueSID(ret.version, ret.arch, ret.engine);
  ret.localDir = path.join(exports.dirVersions, ret.uniqueSID);

  return ret;
};


exports.logErrorAndExit = function () {
  console.error.apply(null, arguments);
  process.exit();
};


exports.readBinaryInfo = function (jxPath, cb) {
  var cmd = [];
  cmd.push({name: "jxv", command: '"' + jxPath + '" -jxv'});
  cmd.push({name: "arch", command: '"' + jxPath + '" -p process.arch'});
  cmd.push({name: "jsv", command: '"' + jxPath + '" -jsv'});
  cmd.push({name: "engine", command: '"' + jxPath + '" -p "process.versions.sm ? \'sm\' : \'v8\'"'});
  cmd.push({name: "engine2", command: '"' + jxPath + '" -p "process.versions.sm || process.versions.v8'});

  if (common.isWindows)
    cmd.push({name: "which", command: 'where jx'});
  else
    cmd.push({name: "which", command: 'which -a jx'});

  var ret = {err: false};
  ret.caption = "";

  jxtools.fs.execMultiple(cmd, {timeout: 1000, skipError: true}, function (ret) {

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
    else if (ret.engine) ret.caption += ", " + ret.engine + ' ' + (ret.engine2 || "");
    cb(ret);
  });
};


exports.copyExecutableSync = function (src, dst) {
  try {
    fs.writeFileSync(dst, fs.readFileSync(src));
  } catch (ex) {
    return {err: "Cannot copy file from '" + src + "' to '" + dst + "'.\n" + ex};
  }

  if (!common.isWindows) {
    try {
      fs.chmodSync(dst, 0755);
    } catch (ex) {
      return {err: "Cannot chmod -755 copied jx: " + dst + ".\n" + ex};
    }
  }

  return true;
};


var saveBashProfile = function () {

  var line = '\nexport PATH=~/.jxvm/:$PATH\n';

  var str = '';
  if (fs.existsSync(bash_profile)) {
    str = fs.readFileSync(bash_profile).toString();
    if (str.indexOf(line) !== -1)
      return;
  }

  str += line;
  fs.writeFileSync(bash_profile, str);
};

exports.newConsole = function (which) {
  var arr = which.split("\n");
  var wanted = path.join(common.dirJXVM, "jx");
  var found = false;
  for (var o = 0, len = arr.length; o < len; o++) {
    var p = path.normalize(arr[o].trim());
    if (p === wanted) {
      found = true;
      break;
    }
  }
  if (!found) {
    jxcore.utils.console.warn('You need to open new console window to use jx command.');
  }
};


exports.init = function () {

  if (!fs.existsSync(exports.dirJXVM))
    fs.mkdirSync(exports.dirJXVM);

  if (!fs.existsSync(exports.dirVersions))
    fs.mkdirSync(exports.dirVersions);

  if (!fs.existsSync(exports.dirJXcoreSystem))
    fs.mkdirSync(exports.dirJXcoreSystem);

  if (exports.isWindows) {

  } else {
    //saveBashProfile();
  }

};