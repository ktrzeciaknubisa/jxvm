#!/usr/bin/env node

// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");


var jxtools = require('jxtools');
var common = require("../lib/common.js");
var help = require("../lib/commands/help.js");

if (process.argv.length <= 2)
  help.displayUsage("Too little arguments.");

var argv2 = process.argv[2].replace("--", "");

var fname = path.join(__dirname, "../lib/commands/" + argv2 + ".js");
if (!fs.existsSync(fname))
  help.displayUsage("Invalid command: " + argv2);

var cmd = require(fname);
var input = common.getUserInput();

if (!cmd.run)
  help.displayUsage("Invalid command: " + argv2);

cmd.run(input, function (err) {
  if (err)
    jxcore.utils.console.error(err);
});

