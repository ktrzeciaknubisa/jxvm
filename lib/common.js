// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");
var os = require("os");
var cp = require("child_process");
var util = require("util");
var jxtools = require('jxtools');
var common = require('./common.js');

exports.appName = 'jxvm';
exports.homeDir = path.join(jxtools.homeDir, '.' + exports.appName);
exports.isWindows = process.platform === "win32";
exports.jxName = exports.isWindows ? "jx.exe" : "jx";
exports.jxPath = path.join(exports.homeDir, exports.jxName);

var bash_profile = path.join(jxtools.homeDir, '.bash_profile');

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

exports.jxTargetPath = parsedArgv.local ? path.join(process.cwd(), exports.jxName) : exports.jxPath;


// takes version from process.argv when called e.g.: jxvm use 237
var getDesiredVersion = function () {
  if (!parsedArgv.use || !parsedArgv.use.value)
    return null;

  return jxtools.normalizeJXcoreVersion(parsedArgv.use.value);
};

// takes engine from process.argv
var getDesiredEngine = function () {

  var ret = "";

  if (parsedArgv.sm) ret = "sm";
  if (parsedArgv.v8) ret = "v8";

  var v = getDesiredVersion();
  if (v == "0237" && ret) {
    jxcore.utils.console.warn("This version doesn't support multiple engines. Just V8.")
    ret = "v8";
  }

  // default is V8
  return ret || "v8";
};


// gets arch from process.argv
var getDesiredArchitecture = function () {
  return jxtools.normalizeArchitecture(
    parsedArgv.ia32 || parsedArgv.x32 || parsedArgv["32"] ||
    parsedArgv.x64 || parsedArgv["64"]);
};


// returns e.g. jx_0304osx64v8
var getUniqueSID = function (version, arch, engine, osStr) {

  if (!osStr)
    osStr = jxcore.utils.OSInfo().OS_STR.toLowerCase();

  return "jx_" + jxtools.normalizeJXcoreVersion(version) + osStr + engine;
};

exports.getUserInput = function (version, arch, engine) {
  var ret = {
    "version": version ? jxtools.normalizeJXcoreVersion(version) : getDesiredVersion(),
    "engine": engine || getDesiredEngine(),
    "arch": arch ? jxtools.normalizeArchitecture(arch) : getDesiredArchitecture()
  };

  var x = jxtools.http.getDownloadPackageInfo(ret.version, ret.engine, ret.arch);

  ret.basename = x.basename;
  ret.url = x.url;
  ret.uniqueSID = getUniqueSID(ret.version, ret.arch, ret.engine);

  return ret;
};


exports.logErrorAndExit = function () {
  jxcore.utils.console.error.apply(null, arguments);
  process.exit();
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
  var wanted = path.join(exports.homeDir, "jx");
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

  var ret = jxtools.checkHomeDir(exports.appName, true);
  if (ret.err)
    return false;

  if (exports.isWindows) {

  } else {
    //saveBashProfile();
  }

  return true;
};


exports.getHelp = function(command) {

  if (fs.existsSync(command))
    command = path.basename(command, '.js');

  var f = path.join(__dirname, 'help', command + '.txt');
  var fjxvm = path.join(__dirname, 'help', 'jxvm.txt');

  var file = fjxvm;
  if (fs.existsSync(f))
    file = f;

  return fs.readFileSync(file).toString().trim() + os.EOL;
};

