#!/usr/bin/env node

// Copyright & License details are available under JXCORE_LICENSE file

var logErrorAndExit = function() {
  console.error.apply(null, arguments);
  process.exit(8);
};


if (process.argv.length <= 2)
  logErrorAndExit("Wrong usage");


var common = require("../lib/common.js");
var download = require("../lib/download.js");







var input = common.getUserInput();
console.log(input);


download.download(input, function(err) {
  if (err) {
    console.log(err);
    return;
  }

  download.unzip(input, function(err) {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("unzipped!");
    }
  });
});
