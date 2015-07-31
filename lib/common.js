// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");

var jx_argv = require("./jx_argv.js");
var jx_utils = require("./jx_utils.js");
var db = require("./db.js");

var parsedArgv = null;

var parse = function() {
  var id = process.argv.indexOf("use");
  if (id > -1)
    process.argv[id] = "--use";

  parsedArgv = jx_argv.parse({ force: true});
  //console.log(process.argv);
  //console.log(jx_utils.OSInfo());
}();

exports.getDesiredVersion = function() {
  var v = parsedArgv.use.value.replace(/\./g, "");
  while (v.slice(0,1) === "0")
    v = v.slice(1);

  if (v.length === 3)
    v = "0" + v;

  return v;
};

exports.getDesiredEngine = function() {
  if (parsedArgv.sm)
    return "sm";
  if (parsedArgv.v8)
    return "v8";

  // default
  return "v8";
};

exports.getDesiredArchitecture = function() {
  if (parsedArgv.ia32 || parsedArgv.x32 || parsedArgv["32"])
    return "32";

  if (parsedArgv.x64 || parsedArgv["64"])
    return "64";

  // default
  return process.arch.replace("x", "").replace("ia", "");
};

exports.getDesiredFileName = function() {

  var os = jx_utils.getOS().toLowerCase();
  var arr = os.split("-");
  os = arr[0];

  var str = "jx_" + os + exports.getDesiredArchitecture() + exports.getDesiredEngine() + ".zip";
  return str;
};

exports.getDesiredURL = function() {

  var host = "https://jxcore.s3.amazonaws.com/"
  var v = exports.getDesiredVersion();

  var str = host + v + "/" + exports.getDesiredFileName();
  return str;
};

exports.getUserInput = function() {
  var ret = {
    "version" : exports.getDesiredVersion(),
    "engine" : exports.getDesiredEngine(),
    "arch" : exports.getDesiredArchitecture(),
    "zipFilename" : exports.getDesiredFileName(),
    "url" : exports.getDesiredURL()
  };

  ret.basename = path.basename(ret.zipFilename, ".zip");
  ret.localDir = path.join(__dirname, "../versions/", ret.basename)

  return ret;
};