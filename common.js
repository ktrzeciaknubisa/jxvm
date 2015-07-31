// Copyright & License details are available under JXCORE_LICENSE file

var parsedArgv = null;

var parse = function() {
  var id = process.argv.indexOf("use");
  if (id > -1)
    process.argv[id] = "--use";

  parsedArgv = jxcore.utils.argv.parse({ force: true});
  console.log(process.argv);
  console.log(jxcore.utils.OSInfo());
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

  var os = jxcore.utils.getOS().toLowerCase();
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