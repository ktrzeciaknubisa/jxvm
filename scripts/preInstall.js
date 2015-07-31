#!/usr/bin/env node

// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");

var common = require("../lib/common.js");
var jx_utils = require("../lib/jx_utils.js");
var console = jx_utils.console;

if (process.platform === "win32") {

} else {
  var org = "/usr/local/bin/jx";
  var backup = "/usr/local/bin/jx_jxvm_backup";
  if (fs.existsSync()) {
    fs.writeFileSync(backup, fs.readFileSync(org));
    fs.unlinkSync(org);
  }
}


