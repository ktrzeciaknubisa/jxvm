#!/usr/bin/env node

// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var common = require("../lib/common.js");
var jx_utils = require("../lib/jx_utils.js");
var console = jx_utils.console;


console.log("### PREINSTALL");

if (process.platform === "win32") {

} else {
  var org = "/usr/local/bin/jx";
  var backup = "/usr/local/bin/jx_jxvm_backup";
  if (fs.existsSync(org)) {
    //cp.exec("mv " + org + " " + backup, function(err, stdout, stderr) {

      //console.log(err, stdout + "", stderr + "");

    //});
    //fs.writeFileSync(backup, fs.readFileSync(org));
    //fs.unlinkSync(org);
  }
}


