// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");

var jx_argv = require("./jx_argv.js");
var jx_utils = require("./jx_utils.js");
var console = jx_utils.console;
var db = require("./db.js");

var parsedArgv = null;
exports.parsedArgv = null;

var parse = function () {
  var special = ["help", "use"];
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
  //console.log(process.argv);
  //console.log(exports.parsedArgv);
  //console.log(jx_utils.OSInfo());
}();

exports.isInstalled = path.basename(require.main.filename) === "jxvm.bin.js";


exports.getDesiredVersion = function () {
  if (!parsedArgv.use || !parsedArgv.use.value)
    return null;

  var v = parsedArgv.use.value.replace(/\./g, "");
  while (v.slice(0, 1) === "0")
    v = v.slice(1);

  if (v.length === 3)
    v = "0" + v;

  return v;
};

exports.getDesiredEngine = function () {

  var ret = "";

  if (parsedArgv.sm) ret = "sm";
  if (parsedArgv.v8) ret = "v8";

  var v = exports.getDesiredVersion();
  if (v == "0237" && ret)
    console.warn("This version doesn't support multiple engines. Just V8.")

  // default
  return "v8";
};

exports.getDesiredArchitecture = function () {
  if (parsedArgv.ia32 || parsedArgv.x32 || parsedArgv["32"])
    return "32";

  if (parsedArgv.x64 || parsedArgv["64"])
    return "64";

  // default
  return process.arch.replace("x", "").replace("ia", "");
};

exports.getDesiredFileName = function () {

  var v = exports.getDesiredVersion();

  var os = jx_utils.getOS().toLowerCase();
  var arr = os.split("-");
  os = arr[0];

  if (v == "0237") {
    var str = "jx_" + os + exports.getDesiredArchitecture() + ".zip";
  } else {
    var str = "jx_" + os + exports.getDesiredArchitecture() + exports.getDesiredEngine() + ".zip";
  }


  return str;
};

exports.getDesiredURL = function () {


  var v = exports.getDesiredVersion();

  if (v === "0237") {
    var host = "https://s3.amazonaws.com/nodejx/";
    var str = host + exports.getDesiredFileName();
  } else {
    var host = "https://jxcore.s3.amazonaws.com/"
    var str = host + v + "/" + exports.getDesiredFileName();
  }

  return str;
};

exports.getUserInput = function () {
  var ret = {
    "version": exports.getDesiredVersion(),
    "engine": exports.getDesiredEngine(),
    "arch": exports.getDesiredArchitecture(),
    "zipFilename": exports.getDesiredFileName(),
    "url": exports.getDesiredURL()
  };

  ret.basename = path.basename(ret.zipFilename, ".zip");
  ret.uniqueSID = "jx_" + ret.version + ret.basename.replace("jx_", "");
  ret.localDir = path.join(__dirname, "../versions/", ret.uniqueSID)

  return ret;
};

exports.logPair = function (first, second, color) {
  first = console.setColor(first + ":", "cyan");
  if (color)
    second = console.setColor(second, color);
  console.log(first, second)
};


exports.clearLine = function () {
  var cursorUp = "\033[1A";
  var clearLine = "\033[K";
  console.write(cursorUp + clearLine);
};


exports.logErrorAndExit = function() {
  console.error.apply(null, arguments);
  process.exit();
};
