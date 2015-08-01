// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var console = common.console;


exports.run = function (input, cb) {

  var isWindows = process.platform === "win32";

  if (isWindows) {

  } else {

    if (process.uid !== 0)
      return common.logErrorAndExit("This command needs to be executed with sudo.");
  }


};