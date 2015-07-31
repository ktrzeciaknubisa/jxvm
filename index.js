// Copyright & License details are available under JXCORE_LICENSE file


var logErrorAndExit = function() {
  console.error.apply(null, arguments);
  process.exit(8);
};

if (!jxcore)
  logErrorAndExit("This module can run only with JXcore.");

if (process.argv.length <= 2)
  logErrorAndExit("Wrong usage");


var common = require("./common.js");






console.log(common.getDesiredVersion(), common.getDesiredEngine(), common.getDesiredArchitecture(), common.getDesiredFileName(), common.getDesiredURL());